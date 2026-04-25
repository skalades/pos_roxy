import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/Components/Modal';
import * as Icons from 'lucide-react';
import { formatIDR } from '@/utils/currency';
import { usePage } from '@inertiajs/react';
import printerService from '@/Services/PrinterService';
import { formatDate, formatTime } from '@/utils/datetime';

export default function PaymentModal({ show, onClose, total, onConfirm, processing, cart, selectedCustomer }) {
    const { auth, app_settings } = usePage().props;
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [change, setChange] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [printing, setPrinting] = useState(false);
    
    // Gunakan Ref untuk menyimpan snapshot agar tidak terpengaruh re-render
    const snapshotRef = useRef(null);

    useEffect(() => {
        if (!show) {
            setIsSuccess(false);
            setAmountPaid('');
            snapshotRef.current = null;
        }
    }, [show]);

    useEffect(() => {
        const paidText = amountPaid.toString().replace(/[^0-9]/g, '');
        const paid = parseFloat(paidText) || 0;
        setChange(Math.max(0, paid - total));
    }, [amountPaid, total]);

    const handleAmountClick = (amount) => {
        setAmountPaid(amount.toString());
    };

    const handleConfirm = () => {
        const paidAmount = parseFloat(amountPaid.replace(/[^0-9]/g, '')) || total;
        
        // Ambil nama-nama barber yang melayani (unik)
        const uniqueBarbers = [...new Set(cart
            .filter(item => item.barber_id)
            .map(item => item.barber_name)
        )];
        const barberName = uniqueBarbers.length > 0 ? uniqueBarbers.join(', ') : '-';

        // AMBIL SNAPSHOT SEKARANG (SEBELUM BACKEND DIPANGGIL)
        snapshotRef.current = {
            storeName: app_settings.app_name,
            branchName: auth.user.branch?.name || '',
            branchAddress: auth.user.branch?.address || '',
            cashierName: auth.user.name,
            barberName: barberName,
            website: app_settings.app_website,
            instagram: app_settings.app_instagram,
            whatsapp: app_settings.app_whatsapp,
            date: formatDate(new Date()),
            time: formatTime(new Date()),
            orderId: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
            items: [...cart].map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            total: total,
            payment: paidAmount,
            change: Math.max(0, paidAmount - total)
        };

        console.log('Receipt Snapshot Captured:', snapshotRef.current);

        const paymentData = { 
            paymentMethod, 
            amountPaid: paidAmount, 
            change: Math.max(0, paidAmount - total)
        };
        
        onConfirm(paymentData, () => {
            setIsSuccess(true);
        });
    };

    const handlePrint = async () => {
        if (!snapshotRef.current) {
            alert('Data struk tidak ditemukan. Silakan coba lagi.');
            return;
        }
        
        setPrinting(true);
        try {
            await printerService.printReceipt(snapshotRef.current, app_settings.receipt_logo);
        } catch (error) {
            alert('Gagal mencetak: ' + error.message);
        } finally {
            setPrinting(false);
        }
    };

    // Generate smart quick amounts
    const generateQuickAmounts = () => {
        const roundUps = [50000, 100000, 200000, 500000, 1000000];
        const above = roundUps.filter(amt => amt > total);
        const candidates = [total, ...above].slice(0, 5);
        return [...new Set(candidates)];
    };

    const quickAmounts = generateQuickAmounts();

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-5 sm:p-8 relative">
                {!isSuccess ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 px-2">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pembayaran</h3>
                                <p className="text-sm text-slate-500 font-medium">Selesaikan transaksi belanja</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                            >
                                <Icons.X size={24} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left Column */}
                            <div className="lg:col-span-5 space-y-6">
                                <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Icons.Wallet size={80} />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-teal-400/80 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Tagihan</p>
                                        <h2 className="text-3xl font-black text-white tracking-tight">
                                            {formatIDR(total)}
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Metode Pembayaran</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'cash', name: 'Tunai', icon: <Icons.Banknote size={18} /> },
                                            { id: 'qris', name: 'QRIS', icon: <Icons.QrCode size={18} /> },
                                            { id: 'card', name: 'Kartu', icon: <Icons.CreditCard size={18} /> },
                                            { id: 'transfer', name: 'Transfer', icon: <Icons.Send size={18} /> },
                                        ].map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${
                                                    paymentMethod === method.id
                                                    ? 'border-roxy-primary bg-roxy-primary/5 text-roxy-primary shadow-lg shadow-roxy-primary/5'
                                                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                                                } active:scale-95`}
                                            >
                                                <div className={paymentMethod === method.id ? 'text-roxy-primary' : 'text-slate-400'}>
                                                    {method.icon}
                                                </div>
                                                {method.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                {paymentMethod === 'cash' ? (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Jumlah Bayar</p>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder="0"
                                                    value={amountPaid ? parseInt(amountPaid.toString().replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                                        setAmountPaid(rawValue);
                                                    }}
                                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-slate-900 focus:ring-4 focus:ring-roxy-primary/5 focus:border-roxy-primary transition-all placeholder:text-slate-200"
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {quickAmounts.map((amt) => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => handleAmountClick(amt)}
                                                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all active:scale-90 ${
                                                            amt === total
                                                            ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                                                            : 'bg-white border-slate-200 hover:border-roxy-primary hover:text-roxy-primary text-slate-500'
                                                        }`}
                                                    >
                                                        {amt === total ? `Pas ${formatIDR(amt)}` : formatIDR(amt)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 relative overflow-hidden">
                                            <p className="text-amber-600/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Uang Kembali</p>
                                            <h2 className="text-2xl font-black text-amber-600">{formatIDR(change)}</h2>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 min-h-[200px]">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 text-roxy-primary animate-pulse">
                                            <Icons.QrCode size={32} />
                                        </div>
                                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] mb-2">Pembayaran Digital</h4>
                                        <p className="text-[10px] text-slate-500 font-medium max-w-[200px]">Silakan scan QRIS atau gunakan terminal pembayaran.</p>
                                    </div>
                                )}

                                <button
                                    disabled={processing || (paymentMethod === 'cash' && (parseFloat(amountPaid.toString().replace(/[^0-9]/g, '')) || 0) < total)}
                                    onClick={handleConfirm}
                                    className="w-full bg-roxy-primary hover:bg-roxy-primary-dark text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-roxy-primary/20 transition-all flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none uppercase tracking-[0.2em] active:scale-[0.98]"
                                >
                                    {processing ? (
                                        <Icons.Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <Icons.CheckCircle2 size={20} />
                                    )}
                                    <span>Selesaikan Transaksi</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-24 h-24 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-teal-500/20 mb-8 animate-bounce">
                            <Icons.Check size={48} strokeWidth={3} />
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Pembayaran Berhasil!</h2>
                        <p className="text-slate-500 font-medium mb-12">Transaksi telah dicatat ke dalam sistem.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <button
                                onClick={handlePrint}
                                disabled={printing}
                                className="flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {printing ? (
                                    <Icons.Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Icons.Printer size={20} />
                                )}
                                CETAK STRUK
                            </button>
                            
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center gap-3 bg-white text-slate-900 border-2 border-slate-100 py-5 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95"
                            >
                                <Icons.PlusCircle size={20} />
                                TRANSAKSI BARU
                            </button>
                        </div>

                        <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Printer: RP02N (Bluetooth)
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
