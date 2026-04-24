import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { X, Scissors, Tag, Wallet, Clock, FileText, Image as ImageIcon, Store } from 'lucide-react';
import InputError from '@/Components/InputError';
import CurrencyInput from '@/Components/CurrencyInput';

export default function ServiceModal({ show, onClose, service = null, categories, branches }) {
    const isEdit = !!service;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        branch_id: '',
        category_id: '',
        name: '',
        description: '',
        price: 0,
        duration_minutes: 30,
        commission_rate: 10,
        is_active: true,
        image: '',
    });

    useEffect(() => {
        if (service) {
            setData({
                branch_id: service.branch_id || '',
                category_id: service.category_id || '',
                name: service.name || '',
                description: service.description || '',
                price: service.price || 0,
                duration_minutes: service.duration_minutes || 30,
                commission_rate: service.commission_rate || 10,
                is_active: service.is_active ?? true,
                image: service.image || '',
            });
        } else {
            reset();
            if (categories.length > 0) setData('category_id', categories[0].id);
        }
        clearErrors();
    }, [service, show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('services.update', service.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('services.store'), {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-roxy-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-roxy-primary/10 rounded-2xl flex items-center justify-center text-roxy-primary">
                                <Scissors size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isEdit ? 'Edit Layanan' : 'Tambah Layanan'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    {isEdit ? 'Perbarui detail layanan' : 'Buat penawaran jasa baru'}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nama Layanan</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700"
                                    placeholder="Contoh: Gentleman Cut"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Kategori</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 appearance-none"
                                    value={data.category_id}
                                    onChange={e => setData('category_id', e.target.value)}
                                    required
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.category_id} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Cabang (Opsional)</label>
                                <select
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 appearance-none"
                                    value={data.branch_id}
                                    onChange={e => setData('branch_id', e.target.value)}
                                >
                                    <option value="">Semua Cabang (Global)</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.branch_id} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Deskripsi</label>
                                <textarea
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 min-h-[100px]"
                                    placeholder="Penjelasan singkat..."
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </div>

                        {/* Right Column: Pricing & Options */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Harga Layanan (IDR)</label>
                                <CurrencyInput
                                    value={data.price}
                                    onChange={val => setData('price', val)}
                                    required
                                />
                                <InputError message={errors.price} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center block">Durasi (Menit)</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 text-center"
                                        value={data.duration_minutes}
                                        onChange={e => setData('duration_minutes', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.duration_minutes} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center block">Komisi (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-indigo-600 text-center"
                                        value={data.commission_rate}
                                        onChange={e => setData('commission_rate', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.commission_rate} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">URL Gambar (Opsional)</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700"
                                    placeholder="https://example.com/image.jpg"
                                    value={data.image}
                                    onChange={e => setData('image', e.target.value)}
                                />
                                <InputError message={errors.image} />
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] mt-4">
                                <div>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Status Layanan</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{data.is_active ? 'Aktif di POS' : 'Disembunyikan'}</p>
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
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-[2] py-5 bg-roxy-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-roxy-primary/90 shadow-lg shadow-roxy-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Layanan')}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
