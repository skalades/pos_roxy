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
            console.log('Searching for printer RP02N...');
            
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: 'RP02N' },
                    { services: ['000018f0-0000-1000-8000-00805f9b34fb'] } // Common for thermal printers
                ],
                optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
            });

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
            
            // Find the characteristic that supports writing
            const characteristics = await service.getCharacteristics();
            this.characteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);

            if (!this.characteristic) {
                throw new Error('No write characteristic found on the printer.');
            }

            console.log('Printer connected successfully!');
            return true;
        } catch (error) {
            console.error('Connection failed:', error);
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
     */
    async printReceipt(data, logoUrl) {
        if (!this.device || !this.device.gatt.connected) {
            await this.connect();
        }

        try {
            this.encoder.initialize();

            // Logo Handling
            if (logoUrl) {
                try {
                    const logoSize = 160; // Kembali ke 160 karena stabil
                    const imgData = await this._loadImage(logoUrl, logoSize);
                    if (imgData) {
                        this.encoder.align('center')
                            .image(imgData, logoSize, logoSize, 'threshold') 
                            .newline();
                    }
                } catch (e) {
                    console.error('Logo print error:', e);
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
            this.encoder
                .align('left')
                .line(`Kasir  : ${data.cashierName}`)
                .line(`Barber : ${data.barberName}`)
                .line(`Tgl    : ${data.date}`)
                .line(`No     : ${data.orderId}`)
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
            });

            this.encoder.line('-'.repeat(32));

            // Totals
            const totalLabel = 'Total'.padEnd(20);
            const totalValue = data.total.toLocaleString().padStart(12);
            const payLabel = 'Bayar'.padEnd(20);
            const payValue = data.payment.toLocaleString().padStart(12);
            const changeLabel = 'Kembali'.padEnd(20);
            const changeValue = data.change.toLocaleString().padStart(12);

            this.encoder
                .align('right')
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
        const chunkSize = 20; // Safe for all BLE devices
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            await this.characteristic.writeValue(chunk);
        }
    }

    /**
     * Helper to load image as HTMLImageElement with custom size
     */
    _loadImage(url, size = 160) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Background putih
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, size, size);
                
                const scale = Math.min(size / img.width, size / img.height);
                const x = (size / 2) - (img.width / 2) * scale;
                const y = (size / 2) - (img.height / 2) * scale;
                
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                
                // Logika High-Contrast (Threshold Manual)
                const imageData = ctx.getImageData(0, 0, size, size);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    // Jika warna keabu-abuan, jadikan hitam pekat (solid)
                    const val = avg < 200 ? 0 : 255; 
                    data[i] = val;     // R
                    data[i + 1] = val; // G
                    data[i + 2] = val; // B
                }
                ctx.putImageData(imageData, 0, 0);
                
                resolve(imageData);
            };
            img.onerror = () => {
                console.warn('Failed to load logo image from:', url);
                reject(new Error('Image load failed'));
            };
            img.src = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        });
    }
}

export default new PrinterService();
