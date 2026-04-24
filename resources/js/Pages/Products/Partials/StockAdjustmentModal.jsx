import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { X, Layers, Plus, Minus, FileText, CheckCircle2 } from 'lucide-react';

export default function StockAdjustmentModal({ show, onClose, product }) {
    if (!product) return null;

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        adjustment: 0,
        reason: '',
    });

    useEffect(() => {
        if (show) {
            reset();
            clearErrors();
        }
    }, [show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('products.adjust-stock', product.id), {
            onSuccess: () => onClose(),
        });
    };

    const handleQuickAdd = (amount) => {
        setData('adjustment', data.adjustment + amount);
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-roxy-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-roxy-primary/10 rounded-2xl flex items-center justify-center text-roxy-primary">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    Update Stok
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    {product.name}
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 mb-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Stok Saat Ini</span>
                        <p className="text-4xl font-black text-white">{product.stock_quantity}</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2 text-center">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Jumlah Penyesuaian</label>
                            <div className="flex items-center justify-center gap-6">
                                <button
                                    type="button"
                                    onClick={() => setData('adjustment', data.adjustment - 1)}
                                    className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                                >
                                    <Minus size={24} />
                                </button>
                                
                                <div className="text-3xl font-black text-slate-800 w-24 text-center">
                                    {data.adjustment > 0 ? '+' : ''}{data.adjustment}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setData('adjustment', data.adjustment + 1)}
                                    className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-90"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                            {errors.adjustment && <p className="text-rose-500 text-[10px] font-bold mt-2">{errors.adjustment}</p>}
                        </div>

                        {/* Quick Presets */}
                        <div className="grid grid-cols-4 gap-3">
                            {[5, 10, 20, 50].map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleQuickAdd(val)}
                                    className="py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-600 hover:bg-white hover:border-roxy-primary hover:text-roxy-primary transition-all active:scale-95"
                                >
                                    +{val}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Alasan (Opsional)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-roxy-primary transition-colors">
                                    <FileText size={18} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="Contoh: Stok Masuk Baru, Barang Rusak, dll."
                                    value={data.reason}
                                    onChange={e => setData('reason', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing || data.adjustment === 0}
                            className="flex-[2] py-4 bg-roxy-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-roxy-primary/90 shadow-lg shadow-roxy-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {processing ? 'Menyimpan...' : 'Konfirmasi Stok'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
