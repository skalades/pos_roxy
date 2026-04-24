import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    Plus, 
    Search, 
    MapPin, 
    Phone, 
    Clock, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    Store,
    Activity,
    ShieldAlert
} from 'lucide-react';
import BranchModal from './Partials/BranchModal';
import { formatTime } from '@/utils/datetime';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';

export default function Index({ branches, managers, filters }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('branches.index'), { search }, { preserveState: true });
    };

    const handleEdit = (branch) => {
        setSelectedBranch(branch);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedBranch(null);
        setShowModal(true);
    };

    const handleDelete = (branch) => {
        if (confirm(`Apakah Anda yakin ingin menghapus cabang ${branch.name}?`)) {
            router.delete(route('branches.destroy', branch.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Manajemen Cabang"
                    backHref={route('dashboard')}
                    subtitle="Kelola outlet dan pengaturan operasional"
                    action={
                        <button
                            onClick={handleAdd}
                            className="bg-roxy-primary hover:bg-roxy-primary/90 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-roxy-primary/20 transition-all active:scale-95 group"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            Tambah Cabang
                        </button>
                    }
                />
            }
        >
            <Head title="Manajemen Cabang" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Search Bar */}
                <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 max-w-2xl">
                    <form onSubmit={handleSearch} className="relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-roxy-primary transition-colors">
                            <Search size={22} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama, kode, atau alamat cabang..."
                            className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </div>

                {/* Branches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {branches.data.length > 0 ? (
                        branches.data.map((branch) => (
                            <div 
                                key={branch.id} 
                                className="group relative bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 overflow-hidden"
                            >
                                {/* Decorative Gradient Blobs */}
                                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-roxy-primary opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-150 transition-all duration-1000"></div>
                                <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-roxy-primary opacity-[0.02] group-hover:scale-125 transition-all duration-1000"></div>

                                {/* Active Badge */}
                                <div className="absolute top-8 right-8 z-10">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        branch.is_active 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full ${branch.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                        {branch.is_active ? 'Aktif' : 'Tutup'}
                                    </div>
                                </div>

                                <div className="relative flex items-start gap-6 mb-10">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-roxy-primary border-4 border-white shadow-xl group-hover:rotate-6 transition-all duration-500 shrink-0">
                                        <Store size={36} />
                                    </div>
                                    <div className="pr-16 pt-2">
                                        <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-roxy-primary transition-colors">{branch.name}</h3>
                                        <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">
                                            {branch.code}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 mb-10 relative">
                                    <div className="flex items-start gap-4 text-slate-500 group/item">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-roxy-primary/10 group-hover/item:text-roxy-primary transition-colors">
                                            <MapPin size={16} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 line-clamp-2 pt-1.5">{branch.address}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-slate-500 group/item">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-roxy-primary/10 group-hover/item:text-roxy-primary transition-colors">
                                            <Clock size={16} />
                                        </div>
                                        <p className="text-sm font-black text-slate-700 pt-0.5">
                                            {branch.opening_time?.substring(0, 5)} <span className="text-slate-300 mx-1">—</span> {branch.closing_time?.substring(0, 5)}
                                        </p>
                                    </div>

                                    {branch.manager && (
                                        <div className="flex items-center gap-4 text-slate-500 group/item">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-roxy-primary/10 group-hover/item:text-roxy-primary transition-colors">
                                                <Activity size={16} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-600 pt-0.5">Manager: <span className="text-slate-900">{branch.manager.name}</span></p>
                                        </div>
                                    )}
                                </div>

                                {/* Features / Policies Row */}
                                <div className="flex flex-wrap gap-3 mb-10 relative">
                                    {branch.require_attendance_for_shift && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                            <ShieldAlert size={14} />
                                            Wajib Absen
                                        </div>
                                    )}
                                    {branch.geofence_radius && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-purple-100">
                                            <MapPin size={14} />
                                            {branch.geofence_radius}M Radius
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative">
                                    <div className="flex items-center gap-4">
                                        <a href={`tel:${branch.phone}`} className="w-12 h-12 rounded-[1.25rem] bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-roxy-primary hover:text-white hover:rotate-12 transition-all duration-300">
                                            <Phone size={20} />
                                        </a>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleEdit(branch)}
                                            className="px-6 py-3 bg-roxy-primary text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-roxy-primary/90 shadow-lg shadow-roxy-primary/20 transition-all duration-300 flex items-center gap-2"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(branch)}
                                            className="w-12 h-12 bg-rose-50 text-rose-500 rounded-[1.25rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300 group/del"
                                        >
                                            <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Store size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Tidak Ada Cabang</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                {search ? `Pencarian "${search}" tidak ditemukan.` : 'Belum ada cabang yang terdaftar di sistem.'}
                            </p>
                            {search && (
                                <button 
                                    onClick={() => { setSearch(''); router.get(route('branches.index')); }}
                                    className="mt-6 text-roxy-primary font-bold hover:underline"
                                >
                                    Bersihkan Pencarian
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                <Pagination links={branches.links} />
            </div>

            <BranchModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                branch={selectedBranch}
                managers={managers}
            />
        </AuthenticatedLayout>
    );
}
