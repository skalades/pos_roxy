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
        if (!this.characteristic) {
            const connected = await this.connect();
            if (!connected) return;
        }

        try {
            this.encoder.initialize();

            // 1. Logo
            if (logoUrl) {
                try {
                    const img = await this._loadImage(logoUrl);
                    // Resize/Dither logic is handled by the encoder if we pass canvas/image
                    this.encoder.align('center')
                        .image(img, 160, 160, 'atkinson') // Max width 384px, we use 160px for logo as requested "not too big"
                        .newline();
                } catch (e) {
                    console.warn('Failed to load logo for printing:', e);
                }
            }

            // 2. Header
            this.encoder
                .align('center')
                .line(data.storeName || 'ROXY POS')
                .line(data.branchName || '')
                .line(data.branchAddress || '')
                .line('-'.repeat(32));

            // 3. Info
            this.encoder
                .align('left')
                .line(`Kasir: ${data.cashierName}`)
                .line(`Tgl  : ${data.date}`)
                .line(`No   : ${data.orderId}`)
                .line('-'.repeat(32));

            // 4. Items
            data.items.forEach(item => {
                const name = item.name.substring(0, 20);
                const qty = item.quantity.toString().padStart(2);
                const price = (item.price * item.quantity).toLocaleString().padStart(8);
                
                this.encoder.line(`${name.padEnd(20)} ${qty} ${price}`);
                if (item.name.length > 20) {
                    this.encoder.line(item.name.substring(20));
                }
            });

            this.encoder.line('-'.repeat(32));

            // 5. Totals
            this.encoder
                .align('right')
                .line(`Total     : ${data.total.toLocaleString()}`)
                .line(`Bayar     : ${data.payment.toLocaleString()}`)
                .line(`Kembali   : ${data.change.toLocaleString()}`);

            // 6. Footer
            this.encoder
                .newline()
                .align('center')
                .line('Terima Kasih')
                .line('Sudah Berkunjung')
                .newline()
                .newline()
                .newline()
                .cut();

            const result = this.encoder.encode();
            await this._sendData(result);

        } catch (error) {
            console.error('Printing failed:', error);
            throw error;
        }
    }

    /**
     * Send data in chunks (BLE has a limit of ~20-512 bytes per packet)
     */
    async _sendData(data) {
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
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
}

export default new PrinterService();
