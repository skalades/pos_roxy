import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

class PrinterService {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.encoder = new ReceiptPrinterEncoder({
            language: 'esc-pos',
            width: 32, // 58mm printer usually 32 characters or 384px
        });
    }

    /**
     * Connect to the Bluetooth printer
     */
    async connect() {
        try {
            // 1. Coba cari device yang sudah pernah di-pair (Chrome 85+)
            if (navigator.bluetooth && navigator.bluetooth.getDevices) {
                const devices = await navigator.bluetooth.getDevices();
                const pairedDevice = devices.find(d => 
                    d.name === 'RP02N' || 
                    (d.uuids && d.uuids.includes('000018f0-0000-1000-8000-00805f9b34fb'))
                );
                
                if (pairedDevice) {
                    console.log('Found already paired device:', pairedDevice.name);
                    this.device = pairedDevice;
                }
            }

            // 2. Jika tidak ada device yang sudah di-pair, baru panggil requestDevice
            if (!this.device) {
                console.log('Searching for printer RP02N via requestDevice...');
                this.device = await navigator.bluetooth.requestDevice({
                    filters: [
                        { name: 'RP02N' },
                        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }
                    ],
                    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
                });

                // Add disconnect listener only for new devices
                this.device.addEventListener('gattserverdisconnected', () => {
                    console.warn('Printer disconnected');
                    this.characteristic = null;
                });
            }

            // 3. Pastikan terkoneksi ke GATT
            if (!this.device.gatt.connected) {
                await this.device.gatt.connect();
            }

            const server = this.device.gatt;
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            
            const characteristics = await service.getCharacteristics();
            this.characteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

            if (!this.characteristic) {
                throw new Error('No write characteristic found on the printer.');
            }

            console.log('Printer connected successfully!');
            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            this.device = null; // Reset on failure to allow retry
            throw error;
        }
    }

    /**
     * Disconnect from the printer
     */
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.device = null;
        this.characteristic = null;
    }

    /**
     * Print the receipt
     * @param {Object} data Transaction data
     * @param {string} logoUrl URL of the logo image
     * @param {boolean} isInternal Whether this is an internal use receipt
     */
    async printReceipt(data, logoUrl, isInternal = false) {
        if (!this.device || !this.device.gatt.connected) {
            await this.connect();
        }

        try {
            this.encoder.initialize();

            // Internal Header
            if (isInternal) {
                this.encoder
                    .align('center')
                    .line('*** STRUK INTERNAL ***')
                    .line('Bukan Bukti Pembayaran Sah')
                    .newline();
            }

            // Logo Handling
            if (logoUrl) {
                console.log('Printing with logo:', logoUrl);
                try {
                    const logoWidth = 112; 
                    const { imgData, height } = await this._loadImage(logoUrl, logoWidth);
                    if (imgData && height > 0) {
                        this.encoder
                            .align('center')
                            .image(imgData, logoWidth, height, 'floyd-steinberg')
                            .newline();
                        
                        console.log('Logo added to encoder with floyd-steinberg');
                    } else {
                        console.warn('Logo processed but has no content (height 0)');
                    }
                } catch (e) {
                    console.error('Logo print error:', e);
                    // Continue printing even if logo fails
                }
            }

            // Header
            this.encoder
                .align('center')
                .line(data.storeName || 'ROXY POS')
                .line(data.branchName || '')
                .line(data.branchAddress || '')
                .line('-'.repeat(32));

            // Info
            const methodMap = {
                'cash': 'Tunai',
                'qris': 'QRIS',
                'card': 'Kartu',
                'edc': 'EDC',
                'transfer': 'Transfer'
            };
            const methodLabel = methodMap[data.paymentMethod] || data.paymentMethod || '-';

            this.encoder
                .align('left')
                .line(`Kasir : ${data.cashierName}`)
                .line(`Tgl   : ${data.date}`)
                .line(`Jam   : ${data.time || ''}`)
                .line(`Metode: ${methodLabel}`)
                .line(`No    : ${data.orderId}`)
                .line('-'.repeat(32));

            // Items
            data.items.forEach(item => {
                const name = item.name.substring(0, 20);
                const qty = item.quantity.toString().padStart(2);
                const price = (item.price * item.quantity).toLocaleString().padStart(8);
                
                this.encoder.line(`${name.padEnd(20)} ${qty} ${price}`);
                if (item.name.length > 20) {
                    this.encoder.line(`  ${item.name.substring(20)}`);
                }
                
                // Barber per item
                if (item.barber_name) {
                    this.encoder.line(`  [Barber: ${item.barber_name}]`);
                    
                    // Commission for internal receipt
                    if (isInternal && item.commission_rate > 0) {
                        const commission = (item.price * item.quantity) * (item.commission_rate / 100);
                        this.encoder.line(`  [Komisi: Rp ${commission.toLocaleString()}]`);
                    }
                }
            });

            this.encoder.line('-'.repeat(32));

            // Totals
            const totalLabel = 'Total'.padEnd(15);
            const totalValue = data.total.toLocaleString().padStart(17);
            const payLabel = 'Bayar'.padEnd(15);
            const payValue = data.payment.toLocaleString().padStart(17);
            const changeLabel = 'Kembali'.padEnd(15);
            const changeValue = data.change.toLocaleString().padStart(17);

            this.encoder
                .align('left') // Gunakan left tapi value di pad-right
                .line(`${totalLabel}${totalValue}`)
                .line(`${payLabel}${payValue}`)
                .line(`${changeLabel}${changeValue}`)
                .newline();

            // Dynamic Social Media Footer
            this.encoder.align('center');
            
            if (data.website) {
                this.encoder.line(data.website);
            }
            if (data.instagram) {
                this.encoder.line(`IG: ${data.instagram}`);
            }
            if (data.whatsapp) {
                this.encoder.line(`WA: ${data.whatsapp}`);
            }

            if (data.website || data.instagram || data.whatsapp) {
                this.encoder.newline();
            }

            // Footer
            this.encoder
                .align('center')
                .line('Terima Kasih')
                .line('Sudah Berkunjung')
                .newline()
                .newline()
                .cut();

            const commands = this.encoder.encode();
            await this._sendInChunks(commands);

            return true;
        } catch (error) {
            console.error('Printing failed:', error);
            throw error;
        }
    }

    /**
     * Send data in chunks (BLE has a limit of ~20-512 bytes per packet)
     */
    async _sendInChunks(data) {
        const chunkSize = 20; // Gunakan chunk size standar BLE (20 bytes) untuk stabilitas maksimal
        console.log(`Sending ${data.length} bytes in ${chunkSize} byte chunks...`);
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await this.characteristic.writeValue(chunk);
            // Tambahkan delay sedikit lebih besar untuk mengizinkan printer memproses buffer gambar
            await new Promise(r => setTimeout(r, 20));
        }
    }

    /**
     * Helper to load image as HTMLImageElement with custom size
     */
    _loadImage(url, width = 112) {
        return new Promise((resolve, reject) => {
            console.log('Loading image from URL:', url);
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const aspect = img.height / img.width;
                const height = Math.round(width * aspect);
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // 1. Draw with white background (handle transparency)
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // 2. Get data and process pixels
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                // Simple Thresholding with a balanced threshold
                for (let i = 0; i < data.length; i += 4) {
                    const alpha = data[i+3];
                    if (alpha < 50) { // Transparent -> White
                        data[i] = data[i+1] = data[i+2] = 255;
                    } else {
                        // Grayscale conversion
                        const grayscale = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                        // Boost contrast: values near white become white, values near black become black
                        const val = grayscale < 200 ? (grayscale < 100 ? 0 : grayscale) : 255;
                        data[i] = data[i+1] = data[i+2] = val;
                    }
                    data[i+3] = 255; 
                }

                // 3. AUTO-TRIM: Find the actual content boundaries
                let top = 0;
                let bottom = height - 1;

                const isRowWhite = (y) => {
                    for (let x = 0; x < width; x++) {
                        const idx = (y * width + x) * 4;
                        if (data[idx] < 240) return false; // Not white enough
                    }
                    return true;
                };

                while (top < bottom && isRowWhite(top)) top++;
                while (bottom > top && isRowWhite(bottom)) bottom--;

                // Apply trim if needed
                const trimmedHeight = Math.max(0, (bottom - top) + 1);
                
                if (trimmedHeight === 0) {
                    resolve({ imgData: null, height: 0 });
                    return;
                }

                const trimmedCanvas = document.createElement('canvas');
                trimmedCanvas.width = width;
                trimmedCanvas.height = trimmedHeight;
                const tCtx = trimmedCanvas.getContext('2d');
                
                tCtx.putImageData(imageData, 0, -top);
                const finalData = tCtx.getImageData(0, 0, width, trimmedHeight);
                
                console.log(`Logo processed: ${width}x${trimmedHeight} (Original: ${height}px)`);
                resolve({ imgData: finalData, height: trimmedHeight });
            };
            img.onerror = (err) => {
                console.error('Failed to load logo image:', url, err);
                reject(new Error('Image load failed'));
            };
            // Cache busting
            const cacheUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
            img.src = cacheUrl;
        });
    }
}

export default new PrinterService();
