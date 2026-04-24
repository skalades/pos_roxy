import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { X, Tag, FileText, Layers, CheckCircle2 } from 'lucide-react';
import InputError from '@/Components/InputError';

export default function CategoryModal({ show, onClose, category = null }) {
    const isEdit = !!category;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        type: 'service',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        if (category) {
            setData({
                name: category.name || '',
                type: category.type || 'service',
                description: category.description || '',
                is_active: category.is_active ?? true,
            });
        } else {
            reset();
        }
        clearErrors();
    }, [category, show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('categories.update', category.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-roxy-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-roxy-primary/10 rounded-2xl flex items-center justify-center text-roxy-primary">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    {isEdit ? 'Perbarui data kategori' : 'Buat kategori baru'}
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

                    <div className="space-y-6">
                        {/* Type Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setData('type', 'service')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${data.type === 'service' ? 'border-roxy-primary bg-roxy-primary/5 text-roxy-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                <Tag size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Layanan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('type', 'product')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${data.type === 'product' ? 'border-roxy-primary bg-roxy-primary/5 text-roxy-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                <Tag size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Produk</span>
                            </button>
                        </div>

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nama Kategori</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-roxy-primary transition-colors">
                                    <Tag size={18} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                    placeholder="Contoh: Haircut, Pomade, dll."
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.name} />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Deskripsi (Opsional)</label>
                            <div className="relative group">
                                <div className="absolute top-4 left-5 text-slate-400 group-focus-within:text-roxy-primary transition-colors">
                                    <FileText size={18} />
                                </div>
                                <textarea
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300 min-h-[100px]"
                                    placeholder="Keterangan singkat kategori..."
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.description} />
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${data.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Kategori Aktif</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Kategori ini dapat digunakan.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                />
                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-roxy-primary"></div>
                            </label>
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
                            disabled={processing}
                            className="flex-[2] py-4 bg-roxy-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-roxy-primary/90 shadow-lg shadow-roxy-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Kategori')}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
