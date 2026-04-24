import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    Plus, 
    Search, 
    User, 
    Mail, 
    Phone, 
    Shield, 
    Store, 
    Edit2, 
    Trash2, 
    Filter,
    X,
    Briefcase,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import UserModal from './Partials/UserModal';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';

export default function Index({ users, branches, filters, roles }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || '');

    const handleFilter = (newFilters = {}) => {
        const params = {
            search: newFilters.search !== undefined ? newFilters.search : search,
            role: newFilters.role !== undefined ? newFilters.role : roleFilter,
            branch_id: newFilters.branch_id !== undefined ? newFilters.branch_id : branchFilter,
        };

        router.get(route('users.index'), params, { 
            preserveState: true,
            replace: true 
        });
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        handleFilter();
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedUser(null);
        setShowModal(true);
    };

    const handleDelete = (user) => {
        if (confirm(`Apakah Anda yakin ingin menghapus user ${user.name}?`)) {
            router.delete(route('users.destroy', user.id));
        }
    };

    const clearFilters = () => {
        setSearch('');
        setRoleFilter('');
        setBranchFilter('');
        router.get(route('users.index'));
    };

    const getRoleColor = (role) => {
        const colors = {
            super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
            admin: 'bg-blue-100 text-blue-700 border-blue-200',
            manager: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            cashier: 'bg-teal-100 text-teal-700 border-teal-200',
            barber: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
        return colors[role] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Manajemen User"
                    backHref={route('dashboard')}
                    subtitle="Kelola staff & akses personil"
                    action={
                        <button
                            onClick={handleAdd}
                            className="w-full sm:w-auto bg-roxy-primary hover:bg-roxy-primary/90 text-white px-8 py-4 rounded-[1.25rem] flex items-center justify-center gap-3 font-black shadow-xl shadow-roxy-primary/20 transition-all active:scale-95 group uppercase tracking-widest text-[11px]"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                            Tambah User
                        </button>
                    }
                />
            }
        >
            <Head title="Manajemen User" />

            <div className="max-w-7xl mx-auto space-y-10">
                {/* Search & Filters Section */}
                <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-5">
                        <form onSubmit={handleSearch} className="flex-1 relative group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-roxy-primary transition-colors">
                                <Search size={22} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari staff berdasarkan nama atau email..."
                                className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>

                        <div className="flex flex-wrap gap-4">
                            <select 
                                className="flex-1 sm:flex-none bg-slate-50/50 border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white py-5 pl-6 pr-14 font-black text-[11px] text-slate-600 uppercase tracking-[0.1em] transition-all"
                                value={roleFilter}
                                onChange={(e) => { 
                                    const val = e.target.value;
                                    setRoleFilter(val); 
                                    handleFilter({ role: val }); 
                                }}
                            >
                                <option value="">Filter Role</option>
                                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>

                            <select 
                                className="flex-1 sm:flex-none bg-slate-50/50 border-transparent rounded-[1.5rem] focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary focus:bg-white py-5 pl-6 pr-14 font-black text-[11px] text-slate-600 uppercase tracking-[0.1em] transition-all"
                                value={branchFilter}
                                onChange={(e) => { 
                                    const val = e.target.value;
                                    setBranchFilter(val); 
                                    handleFilter({ branch_id: val }); 
                                }}
                            >
                                <option value="">Filter Cabang</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>

                            {(search || roleFilter || branchFilter) && (
                                <button 
                                    onClick={clearFilters}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-5 text-rose-500 font-black text-[11px] uppercase tracking-widest hover:bg-rose-50 rounded-[1.5rem] transition-all"
                                >
                                    <X size={18} /> Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Users List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {users.data.length > 0 ? (
                        users.data.map((user) => (
                            <div 
                                key={user.id} 
                                className="group relative bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-700 overflow-hidden"
                            >
                                {/* Decorative Gradient Blobs - Toned down for elegance */}
                                <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-150 transition-all duration-1000 ${user.role === 'barber' ? 'bg-emerald-500' : 'bg-roxy-primary'}`}></div>
                                <div className={`absolute -bottom-16 -left-16 w-40 h-40 rounded-full opacity-[0.02] group-hover:scale-125 transition-all duration-1000 ${user.role === 'barber' ? 'bg-emerald-500' : 'bg-roxy-primary'}`}></div>

                                <div className="relative flex items-start gap-6 mb-10">
                                    <div className="relative shrink-0">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-300 border-4 border-white shadow-xl group-hover:rotate-3 transition-all duration-500 overflow-hidden">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={40} />
                                            )}
                                        </div>
                                        {/* Status Indicator Dot */}
                                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            {user.is_active && <CheckCircle size={10} className="text-white" />}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="text-xl font-black text-slate-800 leading-none truncate mb-3 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${getRoleColor(user.role)}`}>
                                            <Shield size={10} />
                                            {user.role.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8 relative">
                                    <div className="flex items-center gap-4 text-slate-500 hover:text-indigo-600 transition-colors group/item">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover/item:bg-indigo-50">
                                            <Mail size={16} />
                                        </div>
                                        <p className="text-[13px] font-bold truncate">{user.email}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-slate-500 hover:text-indigo-600 transition-colors group/item">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover/item:bg-indigo-50">
                                            <Phone size={16} />
                                        </div>
                                        <p className="text-[13px] font-bold">{user.phone || 'N/A'}</p>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-500 hover:text-indigo-600 transition-colors group/item">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover/item:bg-indigo-50">
                                            <Store size={16} />
                                        </div>
                                        <p className="text-[13px] font-black text-slate-700">
                                            {user.branch ? user.branch.name : 'Akses Global'}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats/Details Grid - Dark Premium Style */}
                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="bg-slate-900/5 p-5 rounded-[1.75rem] border border-slate-200/50 backdrop-blur-sm group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                        <p className="text-[9px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-[0.2em] mb-2">Rate Komisi</p>
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={18} className="text-emerald-500" />
                                            <span className="text-base font-black tracking-tight">{user.commission_rate}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/5 p-5 rounded-[1.75rem] border border-slate-200/50 backdrop-blur-sm group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                        <p className="text-[9px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-[0.2em] mb-2">Jam Kerja</p>
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} className="text-indigo-500" />
                                            <span className="text-[11px] font-black tracking-tight">{user.work_start_time?.substring(0, 5)} - {user.work_end_time?.substring(0, 5)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between relative">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Joined: {user.hire_date ? new Date(user.hire_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'N/A'}
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleEdit(user)}
                                            className="px-6 py-3 bg-roxy-primary text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-roxy-primary/90 shadow-lg shadow-roxy-primary/20 transition-all duration-300 flex items-center gap-2"
                                        >
                                            <Edit2 size={12} /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user)}
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
                                <User size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Tidak Ada User</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">
                                {search ? `Pencarian "${search}" tidak ditemukan.` : 'Belum ada user yang terdaftar di sistem.'}
                            </p>
                            {(search || roleFilter || branchFilter) && (
                                <button 
                                    onClick={clearFilters}
                                    className="mt-6 text-indigo-600 font-bold hover:underline"
                                >
                                    Bersihkan Filter
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                <Pagination links={users.links} />
            </div>

            <UserModal 
                show={showModal} 
                onClose={() => setShowModal(false)} 
                user={selectedUser}
                branches={branches}
                roles={roles}
            />
        </AuthenticatedLayout>
    );
}
