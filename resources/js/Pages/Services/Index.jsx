import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    Plus, 
    Search, 
    Scissors, 
    Edit2, 
    Trash2, 
    Clock,
    Wallet,
    Tag,
    Image as ImageIcon
} from 'lucide-react';
import ServiceModal from './Partials/ServiceModal';
import PageHeader from '@/Components/PageHeader';

export default function Index({ services, categories, branches, filters }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('services.index'), { search, category_id: categoryId }, { preserveState: true });
    };

    const handleFilterCategory = (id) => {
        setCategoryId(id);
        router.get(route('services.index'), { search, category_id: id }, { preserveState: true });
    };

    const handleEdit = (service) => {
        setSelectedService(service);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedService(null);
        setShowModal(true);
    };

    const handleDelete = (service) => {
        if (confirm(`Apakah Anda yakin ingin menghapus layanan ${service.name}?`)) {
            router.delete(route('services.destroy', service.id));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Manajemen Layanan"
                    backHref={route('dashboard')}
                    subtitle="Kelola jasa pangkas, perawatan, dan komisi"
                    action={
                        <button
                            onClick={handleAdd}
                            className="bg-roxy-primary hover:bg-roxy-primary/90 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-roxy-primary/20 transition-all active:scale-95 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            Tambah Layanan
                        </button>
                    }
                />
            }
        >
            <Head title="Manajemen Layanan" />

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
                                placeholder="Cari nama layanan..."
                                className="w-full pl-14 pr-8 py-4 bg-slate-50/50 border-transparent rounded-2xl focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-400 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>

                    <div className="flex bg-white/70 backdrop-blur-xl border border-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-x-auto no-scrollbar max-w-full lg:max-w-md">
                        <button 
                            onClick={() => handleFilterCategory('')}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${!categoryId ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Semua
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat.id}
                                onClick={() => handleFilterCategory(cat.id)}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${categoryId == cat.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.length > 0 ? (
                        services.map((service) => (
                            <div 
                                key={service.id} 
                                className="group relative bg-white border border-slate-100 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 overflow-hidden"
                            >
                                {/* Active Status */}
                                <div className="absolute top-6 right-6 z-10">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        service.is_active 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full ${service.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                        {service.is_active ? 'Aktif' : 'Nonaktif'}
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 mb-8">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[1.75rem] flex items-center justify-center text-roxy-primary border-4 border-white shadow-xl group-hover:rotate-6 transition-all duration-500 overflow-hidden shrink-0">
                                        {service.image ? (
                                            <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Scissors size={32} />
                                        )}
                                    </div>
                                    <div className="pt-2 pr-16">
                                        <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-roxy-primary transition-colors">{service.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <Tag size={12} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                                {service.category?.name || 'Uncategorized'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Clock size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Durasi</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-800">{service.duration_minutes} Menit</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Wallet size={12} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Komisi</span>
                                        </div>
                                        <p className="text-sm font-black text-indigo-600">{service.commission_rate}%</p>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Harga Layanan</span>
                                        <p className="text-2xl font-black text-roxy-primary tracking-tight">
                                            {formatCurrency(service.price)}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleEdit(service)}
                                            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-roxy-primary transition-all duration-300 shadow-lg hover:shadow-roxy-primary/20 active:scale-95"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(service)}
                                            className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300 active:scale-95"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {service.branch_id && (
                                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 bg-roxy-primary rounded-full"></div>
                                        Khusus Cabang: {service.branch?.name}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-300">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Scissors size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Tidak Ada Layanan</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                {search ? `Pencarian "${search}" tidak ditemukan.` : 'Belum ada layanan yang ditambahkan.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <ServiceModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                service={selectedService}
                categories={categories}
                branches={branches}
            />
        </AuthenticatedLayout>
    );
}
