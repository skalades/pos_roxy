import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { X, Package, Tag, Barcode, Layers, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import InputError from '@/Components/InputError';
import CurrencyInput from '@/Components/CurrencyInput';

export default function ProductModal({ show, onClose, product = null, categories, branches }) {
    const isEdit = !!product;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        branch_id: '',
        category_id: '',
        name: '',
        description: '',
        price: 0,
        cost_price: 0,
        stock_quantity: 0,
        min_stock_level: 5,
        barcode: '',
        is_active: true,
        image: '',
    });

    useEffect(() => {
        if (product) {
            setData({
                branch_id: product.branch_id || '',
                category_id: product.category_id || '',
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0,
                cost_price: product.cost_price || 0,
                stock_quantity: product.stock_quantity || 0,
                min_stock_level: product.min_stock_level || 5,
                barcode: product.barcode || '',
                is_active: product.is_active ?? true,
                image: product.image || '',
            });
        } else {
            reset();
            if (categories.length > 0) setData('category_id', categories[0].id);
            if (branches.length > 0) setData('branch_id', branches[0].id);
        }
        clearErrors();
    }, [product, show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('products.update', product.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('products.store'), {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                                <Package size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isEdit ? 'Edit Produk' : 'Tambah Produk'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    {isEdit ? 'Perbarui stok & harga produk' : 'Input produk retail baru'}
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
                        {/* Left Column: Identification */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nama Produk</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                                    placeholder="Contoh: Pomade Suavecito"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Barcode / SKU</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Barcode size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                                        placeholder="Scan atau ketik kode..."
                                        value={data.barcode}
                                        onChange={e => setData('barcode', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.barcode} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Kategori</label>
                                    <select
                                        className="w-full px-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none text-sm"
                                        value={data.category_id}
                                        onChange={e => setData('category_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.category_id} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Cabang</label>
                                    <select
                                        className="w-full px-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none text-sm"
                                        value={data.branch_id}
                                        onChange={e => setData('branch_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Pilih Cabang</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.branch_id} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Deskripsi</label>
                                <textarea
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 min-h-[100px]"
                                    placeholder="Detail produk..."
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </div>

                        {/* Right Column: Pricing & Inventory */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Harga Jual (IDR)</label>
                                    <CurrencyInput
                                        value={data.price}
                                        onChange={val => setData('price', val)}
                                        required
                                    />
                                    <InputError message={errors.price} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Harga Beli / Modal (IDR)</label>
                                    <CurrencyInput
                                        value={data.cost_price}
                                        onChange={val => setData('cost_price', val)}
                                        required
                                    />
                                    <InputError message={errors.cost_price} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1 text-center block">Stok Saat Ini</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 text-center"
                                        value={data.stock_quantity}
                                        onChange={e => setData('stock_quantity', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.stock_quantity} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] ml-1 text-center block">Min. Stok</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 bg-rose-50/30 border-transparent rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white transition-all font-bold text-rose-600 text-center"
                                        value={data.min_stock_level}
                                        onChange={e => setData('min_stock_level', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.min_stock_level} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] ml-1">URL Gambar (Opsional)</label>
                                <input
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                                    placeholder="https://example.com/product.jpg"
                                    value={data.image}
                                    onChange={e => setData('image', e.target.value)}
                                />
                                <InputError message={errors.image} />
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] mt-4">
                                <div>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Status Produk</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{data.is_active ? 'Tersedia di POS' : 'Disembunyikan'}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={data.is_active}
                                        onChange={e => setData('is_active', e.target.checked)}
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                            className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Produk')}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
