import React, { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import * as Icons from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function PaymentModal({ show, onClose, total, onConfirm, processing }) {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [change, setChange] = useState(0);

    useEffect(() => {
        const paid = parseFloat(amountPaid.replace(/[^0-9]/g, '')) || 0;
        setChange(Math.max(0, paid - total));
    }, [amountPaid, total]);

    const handleAmountClick = (amount) => {
        setAmountPaid(amount.toString());
    };

    // Generate smart quick amounts that always include exact total
    // and sensible round-up amounts above total, up to Rp 1.000.000
    const generateQuickAmounts = () => {
        const roundUps = [50000, 100000, 200000, 500000, 1000000];
        const above = roundUps.filter(amt => amt > total);
        // Always include exact total, then next 3 round-up amounts
        const candidates = [total, ...above].slice(0, 5);
        // Deduplicate
        return [...new Set(candidates)];
    };

    const quickAmounts = generateQuickAmounts();

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-5 sm:p-8 relative">
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
                    {/* Left Column (5/12) */}
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

                    {/* Right Column (7/12) */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {paymentMethod === 'cash' ? (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Jumlah Bayar</p>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={amountPaid ? parseInt(amountPaid).toLocaleString('id-ID') : ''}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                                setAmountPaid(rawValue);
                                            }}
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-slate-900 focus:ring-4 focus:ring-roxy-primary/5 focus:border-roxy-primary transition-all placeholder:text-slate-200"
                                        />
                                    </div>
                                    {/* Smart Quick Amounts — always shows amounts >= total */}
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
                            disabled={processing || (paymentMethod === 'cash' && (parseFloat(amountPaid) || 0) < total)}
                            onClick={() => onConfirm({ paymentMethod, amountPaid: parseFloat(amountPaid) || total, change })}
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
            </div>
        </Modal>
    );
}
