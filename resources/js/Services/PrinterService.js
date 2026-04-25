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
                    // Gunakan snapshot logoUrl yang valid
                    const imgData = await this._loadImage(logoUrl);
                    if (imgData) {
                        this.encoder.align('center')
                            .image(imgData, 160, 160, 'atkinson')
                            .newline();
                    }
                } catch (e) {
                    console.error('Logo print error:', e);
                    // Lanjut tanpa logo jika gagal
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
                .line(`Kasir: ${data.cashierName}`)
                .line(`Tgl  : ${data.date}`)
                .line(`No   : ${data.orderId}`)
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
     * Helper to load image as HTMLImageElement
     */
    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Resize to fixed size for thermal consistency
                const size = 160;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Draw white background (thermal doesn't do transparency)
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, size, size);
                
                // Draw image centered
                const scale = Math.min(size / img.width, size / img.height);
                const x = (size / 2) - (img.width / 2) * scale;
                const y = (size / 2) - (img.height / 2) * scale;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                
                resolve(ctx.getImageData(0, 0, size, size));
            };
            img.onerror = () => {
                console.warn('Failed to load logo image from:', url);
                reject(new Error('Image load failed'));
            };
            // Add cache buster to avoid CORS issues with cached images
            img.src = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        });
    }
}

export default new PrinterService();
