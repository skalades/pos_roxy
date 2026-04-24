import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    Plus, 
    Search, 
    Tag, 
    Edit2, 
    Trash2, 
    Layers,
    Scissors,
    Package
} from 'lucide-react';
import CategoryModal from './Partials/CategoryModal';
import PageHeader from '@/Components/PageHeader';

export default function Index({ categories, filters }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('categories.index'), { search, type }, { preserveState: true });
    };

    const handleFilterType = (newType) => {
        setType(newType);
        router.get(route('categories.index'), { search, type: newType }, { preserveState: true });
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setShowModal(true);
    };

    const handleDelete = (category) => {
        if (confirm(`Apakah Anda yakin ingin menghapus kategori ${category.name}?`)) {
            router.delete(route('categories.destroy', category.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Manajemen Kategori"
                    backHref={route('dashboard')}
                    subtitle="Kelola pengelompokan layanan dan produk"
                    action={
                        <button
                            onClick={handleAdd}
                            className="bg-roxy-primary hover:bg-roxy-primary/90 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-roxy-primary/20 transition-all active:scale-95 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            Tambah Kategori
                        </button>
                    }
                />
            }
        >
            <Head title="Manajemen Kategori" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Search & Filter Bar */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="bg-white/70 backdrop-blur-xl border border-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/50 flex-1">
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-roxy-primary transition-colors">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari kategori..."
                                className="w-full pl-14 pr-8 py-4 bg-slate-50/50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-400 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>

                    <div className="flex bg-white/70 backdrop-blur-xl border border-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50">
                        <button 
                            onClick={() => handleFilterType('')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!type ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Semua
                        </button>
                        <button 
                            onClick={() => handleFilterType('service')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${type === 'service' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Scissors size={14} /> Layanan
                        </button>
                        <button 
                            onClick={() => handleFilterType('product')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${type === 'product' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Package size={14} /> Produk
                        </button>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <div 
                                key={category.id} 
                                className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    {category.type === 'service' ? <Scissors size={80} /> : <Package size={80} />}
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            category.type === 'service' 
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                                                : 'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {category.type === 'service' ? 'Layanan' : 'Produk'}
                                        </div>
                                        {!category.is_active && (
                                            <div className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                                                Nonaktif
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-roxy-primary transition-colors">{category.name}</h3>
                                    <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-8 h-10">
                                        {category.description || 'Tidak ada deskripsi.'}
                                    </p>

                                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-50">
                                        <button 
                                            onClick={() => handleEdit(category)}
                                            className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-roxy-primary hover:text-white transition-all duration-300"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(category)}
                                            className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-300">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Layers size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Tidak Ada Kategori</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                {search ? `Pencarian "${search}" tidak ditemukan.` : 'Belum ada kategori yang terdaftar.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <CategoryModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                category={selectedCategory}
            />
        </AuthenticatedLayout>
    );
}
