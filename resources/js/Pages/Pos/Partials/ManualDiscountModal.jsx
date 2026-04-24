import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import { X, Percent, Banknote, Scissors, Package } from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function ManualDiscountModal({ show, onClose, onConfirm, currentDiscount, subtotal }) {
    const [type, setType] = useState(currentDiscount.type || 'fixed');
    const [value, setValue] = useState(currentDiscount.value || 0);

    const handleConfirm = (e) => {
        e.preventDefault();
        onConfirm({ type, value: Number(value) });
        onClose();
    };

    const quickPercents = [5, 10, 15, 20, 25, 50];
    const quickFixed = [5000, 10000, 15000, 20000, 25000, 50000];

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Potongan Harga</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Tambahkan diskon manual untuk transaksi ini</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleConfirm} className="space-y-6">
                    {/* Toggle Type */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setType('fixed')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${type === 'fixed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            <Banknote size={16} />
                            Nominal (Rp)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('percentage')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${type === 'percentage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            <Percent size={16} />
                            Persentase (%)
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-black focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                                placeholder="0"
                                autoFocus
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                {type === 'fixed' ? 'IDR' : '%'}
                            </div>
                        </div>

                        {/* Quick Selection */}
                        <div className="grid grid-cols-3 gap-2">
                            {(type === 'percentage' ? quickPercents : quickFixed).map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setValue(val)}
                                    className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${value === val ? 'border-teal-500 bg-teal-50 text-teal-600' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'}`}
                                >
                                    {type === 'percentage' ? `${val}%` : formatIDR(val)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setType('fixed');
                                setValue(0);
                            }}
                            className="flex-1 py-4 rounded-2xl font-black text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 uppercase tracking-widest transition-all"
                        >
                            Hapus
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] py-4 rounded-2xl font-black text-xs text-white bg-slate-900 hover:bg-slate-800 uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all"
                        >
                            Simpan Diskon
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
