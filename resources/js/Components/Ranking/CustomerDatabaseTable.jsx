import React from 'react';
import { Users, Search, ChevronRight } from 'lucide-react';
import Pagination from '@/Components/Pagination';

export default function CustomerDatabaseTable({ 
    customers, 
    searchTerm, 
    onSearchChange, 
    formatCurrency 
}) {
    // customers is a paginated object from Laravel (customers.data, customers.links)
    const customerList = customers.data || [];

    return (
        <div className="bg-white rounded-[3rem] border-2 border-slate-900/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl shadow-slate-200/50">
            <div className="p-8 sm:p-10 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Database Pelanggan</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-roxy-primary" />
                        {customers.total || 0} Pelanggan Terdaftar
                    </p>
                </div>
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau telepon..."
                        className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-roxy-primary/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kunjungan</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Belanja</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {customerList.length > 0 ? customerList.map((customer) => (
                            <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-white group-hover:shadow-md transition-all">
                                            {customer.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900">{customer.name}</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{customer.phone || 'No Phone'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-slate-900">{customer.transactions_count}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kali</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="font-black text-slate-900">{formatCurrency(customer.transactions_sum_total_amount || 0)}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${customer.transactions_count > 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {customer.transactions_count > 5 ? 'VIP' : 'Reguler'}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <button className="p-2 text-slate-300 hover:text-roxy-primary transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Users size={48} className="text-slate-200" />
                                        <p className="text-slate-400 font-bold">Tidak ada data pelanggan yang cocok.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {customers.links && customers.data && customers.data.length > 0 && (
                <div className="p-8 border-t border-slate-50 flex justify-center">
                    <Pagination links={customers.links} />
                </div>
            )}
        </div>
    );
}
