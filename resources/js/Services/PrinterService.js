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
            console.log('Attempting to connect to printer...');
            
            // 1. Coba cari device yang sudah pernah di-pair (Chrome 85+)
            if (navigator.bluetooth && navigator.bluetooth.getDevices) {
                const devices = await navigator.bluetooth.getDevices();
                console.log('Found ' + devices.length + ' paired devices:', devices.map(d => d.name));
                
                const pairedDevice = devices.find(d => 
                    (d.name && d.name.includes('RP02N')) ||   // RP02N (Roxybarber)
                    (d.name && d.name.includes('RPP02N')) ||  // RPP02N (VSC)
                    (d.name && d.name.toLowerCase().includes('printer')) ||
                    (d.uuids && d.uuids.includes('000018f0-0000-1000-8000-00805f9b34fb'))
                );
                
                if (pairedDevice) {
                    console.log('Reusing already paired device:', pairedDevice.name);
                    this.device = pairedDevice;
                }
            }

            // 2. Jika tidak ada device yang sudah di-pair atau getDevices tidak didukung
            if (!this.device) {
                console.log('No paired device found, requesting new device picker...');
                this.device = await navigator.bluetooth.requestDevice({
                    filters: [
                        { name: 'RP02N' },    // Printer lama (Roxybarber)
                        { name: 'RPP02N' },   // Printer VSC (cabang baru)
                        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }
                    ],
                    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
                });

                // Add disconnect listener
                this.device.addEventListener('gattserverdisconnected', () => {
                    console.warn('Printer disconnected');
                    this.characteristic = null;
                    // Optional: auto-reconnect logic could go here
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
                            .image(imgData, logoWidth, height, 'threshold')
                            .newline();
                        
                        console.log('Logo added to encoder with threshold');
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
     * Print the shift report (Opening/Closing)
     * @param {Object} data Shift data
     * @param {string} type 'open' or 'close'
     * @param {string} logoUrl URL of the logo image
     */
    async printShiftReport(data, type = 'open', logoUrl = null) {
        if (!this.device || !this.device.gatt.connected) {
            await this.connect();
        }

        try {
            this.encoder.initialize();

            // Logo Handling
            if (logoUrl) {
                try {
                    const logoWidth = 112;
                    const { imgData, height } = await this._loadImage(logoUrl, logoWidth);
                    if (imgData && height > 0) {
                        this.encoder
                            .align('center')
                            .image(imgData, logoWidth, height, 'threshold')
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
                .line('-'.repeat(32))
                .line(type === 'open' ? 'LAPORAN BUKA SHIFT' : 'LAPORAN TUTUP SHIFT')
                .line('-'.repeat(32));

            // Info
            this.encoder
                .align('left')
                .line(`Kasir : ${data.cashierName}`)
                .line(`Waktu : ${data.time}`)
                .line('-'.repeat(32));

            if (type === 'open') {
                this.encoder
                    .line(`Modal Awal : ${data.openingBalance.toLocaleString('id-ID')}`)
                    .newline()
                    .line('Catatan:')
                    .line(data.notes || '-')
                    .newline();
            } else {
                const totalAllMethods = Object.values(data.paymentSummary || {}).reduce((acc, val) => acc + Number(val), 0);

                this.encoder
                    .line(`Modal Awal : ${data.openingBalance.toLocaleString('id-ID')}`)
                    .line(`Penjualan  : ${data.cashSales.toLocaleString('id-ID')}`)
                    .line(`Pengeluaran: ${data.cashExpenses.toLocaleString('id-ID')}`)
                    .line('-'.repeat(32))
                    .line(`Total Sistem: ${data.expectedBalance.toLocaleString('id-ID')}`)
                    .line(`Total Fisik : ${data.closingBalance.toLocaleString('id-ID')}`)
                    .line(`Selisih     : ${data.difference.toLocaleString('id-ID')}`)
                    .line('-'.repeat(32))
                    .line('Metode Pembayaran:')
                    .align('left');

                Object.entries(data.paymentSummary || {}).forEach(([method, total]) => {
                    const label = method.toUpperCase().padEnd(12);
                    const val = Number(total).toLocaleString('id-ID').padStart(20);
                    this.encoder.line(`${label}${val}`);
                });

                this.encoder.line('-'.repeat(32))
                    .line(`TOTAL PENDAPATAN (GABUNGAN):`)
                    .line(`${totalAllMethods.toLocaleString('id-ID').padStart(32)}`);

                if (data.totalDiscount > 0) {
                    this.encoder.line('-'.repeat(32))
                        .line(`TOTAL DISKON DIBERIKAN:`)
                        .line(`${data.totalDiscount.toLocaleString('id-ID').padStart(32)}`);

                    if (data.discountBreakdown && data.discountBreakdown.length > 0) {
                        this.encoder.line('Rincian Diskon (Per Transaksi):').align('left');
                        data.discountBreakdown.forEach(d => {
                            const trxInfo = d.trx_number.substring(0, 20);
                            const priceStr = Number(d.discount_amount).toLocaleString('id-ID');
                            const spaceCount = Math.max(1, 32 - trxInfo.length - priceStr.length);
                            this.encoder.line(trxInfo + ' '.repeat(spaceCount) + priceStr);
                            
                            if (d.items) {
                                // Potong string agar muat di kertas 32 char, prefix dengan panah
                                const itemsStr = ` > ${d.items}`.substring(0, 32);
                                this.encoder.line(itemsStr);
                            }
                        });
                    }
                }

                this.encoder.line('-'.repeat(32))
                    .line('Rincian Layanan:')
                    .align('left');

                (data.servicesBreakdown || []).forEach(s => {
                    const nameWithQty = `${s.item_name} (${s.qty})`;
                    const priceStr = Number(s.total).toLocaleString('id-ID');
                    const spaceCount = Math.max(1, 32 - nameWithQty.length - priceStr.length);
                    this.encoder.line(nameWithQty + ' '.repeat(spaceCount) + priceStr);
                });

                this.encoder.line('-'.repeat(32))
                    .line('Rincian Produk:')
                    .align('left');

                (data.productsBreakdown || []).forEach(p => {
                    const nameWithQty = `${p.item_name} (${p.qty})`;
                    const priceStr = Number(p.total).toLocaleString('id-ID');
                    const spaceCount = Math.max(1, 32 - nameWithQty.length - priceStr.length);
                    this.encoder.line(nameWithQty + ' '.repeat(spaceCount) + priceStr);
                });

                this.encoder.line('-'.repeat(32))
                    .line('Komisi Barber:');

                (data.barberCommissions || []).forEach(b => {
                    const label = b.name.substring(0, 12).padEnd(12);
                    const val = b.total.toLocaleString('id-ID').padStart(20);
                    this.encoder.line(`${label}${val}`);
                });

                this.encoder.line('-'.repeat(32))
                    .newline()
                    .line('Catatan:')
                    .line(data.notes || '-')
                    .newline();
            }

            // Footer
            this.encoder
                .align('center')
                .line('-'.repeat(32))
                .line('Dicetak pada:')
                .line(new Date().toLocaleString('id-ID'))
                .newline()
                .newline()
                .cut();

            const commands = this.encoder.encode();
            await this._sendInChunks(commands);

            return true;
        } catch (error) {
            console.error('Shift printing failed:', error);
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

            // FIX 1: Set crossOrigin untuk semua URL agar Canvas tidak terkena tainted error
            // (SecurityError: getImageData tainted canvas) — berlaku untuk URL relatif maupun absolut
            img.crossOrigin = 'anonymous';

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

                // FIX 3 (thresholding): Binarize proper ke hitam/putih murni
                for (let i = 0; i < data.length; i += 4) {
                    const alpha = data[i+3];
                    if (alpha < 50) { // Transparent -> White
                        data[i] = data[i+1] = data[i+2] = 255;
                    } else {
                        // Grayscale conversion
                        const grayscale = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                        // Binarize: < 128 -> hitam, >= 128 -> putih (tidak ada abu-abu)
                        const val = grayscale < 128 ? 0 : 255;
                        data[i] = data[i+1] = data[i+2] = val;
                    }
                    data[i+3] = 255;
                }

                // 3. AUTO-TRIM: Temukan batas konten yang sebenarnya
                let top = 0;
                let bottom = height - 1;

                // FIX 3 (trim): Threshold 250 — lebih toleran dari 240 sebelumnya
                const isRowWhite = (y) => {
                    for (let x = 0; x < width; x++) {
                        const idx = (y * width + x) * 4;
                        if (data[idx] < 250) return false; // Hanya pixel nyaris putih sempurna
                    }
                    return true;
                };

                while (top < bottom && isRowWhite(top)) top++;
                while (bottom > top && isRowWhite(bottom)) bottom--;

                const trimmedHeight = Math.max(0, (bottom - top) + 1);
                
                if (trimmedHeight === 0) {
                    console.warn('Logo image is entirely white after processing — logo will be skipped.');
                    resolve({ imgData: null, height: 0 });
                    return;
                }

                // FIX 5: ESC/POS encoder mensyaratkan height kelipatan 8
                // Bulatkan ke atas ke kelipatan 8 terdekat (misal: 110 -> 112)
                const alignedHeight = Math.ceil(trimmedHeight / 8) * 8;

                const trimmedCanvas = document.createElement('canvas');
                trimmedCanvas.width = width;
                trimmedCanvas.height = alignedHeight;
                const tCtx = trimmedCanvas.getContext('2d');

                // Isi dengan putih dulu (padding baris bawah jika alignedHeight > trimmedHeight)
                tCtx.fillStyle = 'white';
                tCtx.fillRect(0, 0, width, alignedHeight);
                tCtx.putImageData(imageData, 0, -top);
                const finalData = tCtx.getImageData(0, 0, width, alignedHeight);
                
                console.log(`Logo processed: ${width}x${alignedHeight} (trimmed: ${trimmedHeight}px, original: ${height}px)`);
                resolve({ imgData: finalData, height: alignedHeight });
            };
            img.onerror = (err) => {
                console.error('Failed to load logo image:', url, err);
                reject(new Error('Image load failed: ' + url));
            };
            // FIX 4: Hapus cache-busting query string — bisa menyebabkan 404 pada static file serve.
            // Logo jarang berubah; cukup ganti file saat upload untuk invalidasi cache.
            img.src = url;
        });
    }
}

export default new PrinterService();
