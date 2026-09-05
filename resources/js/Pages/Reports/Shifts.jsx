import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import { Store, Search, Filter } from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function Shifts({ shifts, branches, filters }) {
    const { data, setData, get, processing } = useForm({
        branch_id: filters.branch_id || '',
        date: filters.date || '',
        status: filters.status || '',
    });

    const handleFilter = (e) => {
        e.preventDefault();
        get(route('reports.shifts'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Laporan Shift"
                    subtitle="Monitoring aktivitas buka tutup kasir"
                    backHref={route('dashboard')}
                />
            }
        >
            <Head title="Laporan Shift" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Filter Section */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cabang</label>
                            <select 
                                value={data.branch_id}
                                onChange={e => setData('branch_id', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:ring-roxy-primary/20 focus:border-roxy-primary"
                            >
                                <option value="">Semua Cabang</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal</label>
                            <input 
                                type="date"
                                value={data.date}
                                onChange={e => setData('date', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:ring-roxy-primary/20 focus:border-roxy-primary"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Status</label>
                            <select 
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:ring-roxy-primary/20 focus:border-roxy-primary"
                            >
                                <option value="">Semua Status</option>
                                <option value="open">Aktif (Open)</option>
                                <option value="closed">Selesai (Closed)</option>
                            </select>
                        </div>
                        <button 
                            type="submit"
                            disabled={processing}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Filter size={18} />
                            Filter
                        </button>
                    </form>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Info Cabang & Kasir</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Waktu Shift</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Modal Awal</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Sistem (Exp)</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Fisik (Close)</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Selisih</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {shifts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada data laporan shift yang sesuai filter.
                                        </td>
                                    </tr>
                                ) : shifts.data.map((shift) => (
                                    <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{shift.branch?.name || '-'}</div>
                                            <div className="text-xs text-slate-500">Kasir: {shift.user?.name || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-800">B: {new Date(shift.opened_at).toLocaleString('id-ID')}</div>
                                            <div className="text-sm text-slate-500">T: {shift.closed_at ? new Date(shift.closed_at).toLocaleString('id-ID') : '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700">
                                            {formatIDR(shift.opening_balance)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700">
                                            {formatIDR(shift.expected_balance)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700">
                                            {shift.closing_balance ? formatIDR(shift.closing_balance) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            {shift.difference !== null ? (
                                                <span className={parseFloat(shift.difference) < 0 ? 'text-rose-600' : parseFloat(shift.difference) > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                                                    {parseFloat(shift.difference) > 0 ? '+' : ''}{formatIDR(shift.difference)}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider }>
                                                {shift.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {shifts.links && shifts.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-1">
                            {shifts.links.map((link, i) => (
                                <a 
                                    key={i}
                                    href={link.url || '#'}
                                    className={px-4 py-2 rounded-xl text-sm font-bold transition-all }
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    onClick={e => {
                                        if (!link.url) e.preventDefault();
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
