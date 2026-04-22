import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import * as Icons from 'lucide-react';
import { formatIDR } from '@/utils/currency';
import Modal from '@/Components/Modal';

const FILTER_OPTIONS = [
    { id: 'all', label: 'Semua Waktu' },
    { id: 'today', label: 'Hari Ini' },
    { id: 'this_week', label: 'Minggu Ini' },
    { id: 'this_month', label: 'Bulan Ini' },
];

export default function TransactionIndex({ transactions, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [activeFilter, setActiveFilter] = useState(filters.date_filter || 'all');
    const [showFilter, setShowFilter] = useState(false);
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const applyFilters = (overrides = {}) => {
        const params = {
            search,
            date_filter: activeFilter,
            ...overrides
        };
        // Remove empty params
        Object.keys(params).forEach(k => !params[k] || params[k] === 'all' ? delete params[k] : null);
        router.get(route('transactions.index'), params, {
            preserveState: true,
            replace: true
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleFilterSelect = (filterId) => {
        setActiveFilter(filterId);
        setShowFilter(false);
        applyFilters({ date_filter: filterId });
    };

    const fetchDetail = async (id) => {
        try {
            const response = await fetch(route('transactions.show', id));
            const data = await response.json();
            setSelectedTrx(data);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to fetch transaction detail', error);
        }
    };

    const activeFilterLabel = FILTER_OPTIONS.find(f => f.id === activeFilter)?.label || 'Semua Waktu';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-roxy-primary rounded-full shadow-[0_0_15px_rgba(13,148,136,0.5)]"></div>
                        <h2 className="text-2xl sm:text-3xl font-black font-heading leading-tight text-roxy-accent tracking-tight">
                            Riwayat Transaksi
                        </h2>
                        <p className="text-sm text-roxy-text-muted mt-1 font-medium">
                            Menampilkan: <span className="text-roxy-primary font-bold">{activeFilterLabel}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/50 backdrop-blur-sm border border-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                {transactions.total || 0} Data
                            </span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Riwayat Transaksi" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                        <form onSubmit={handleSearch} className="relative flex-1">
                            <Icons.Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari No. Transaksi atau Nama Pelanggan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-13 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-roxy-primary/10 focus:border-roxy-primary transition-all"
                            />
                        </form>
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                                activeFilter !== 'all'
                                ? 'bg-roxy-primary text-white shadow-lg shadow-roxy-primary/20'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Icons.Filter size={16} />
                            <span className="hidden sm:inline">Filter</span>
                            {activeFilter !== 'all' && (
                                <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                                    {activeFilterLabel}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filter Options Panel */}
                    {showFilter && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                            {FILTER_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleFilterSelect(opt.id)}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 font-bold text-xs transition-all active:scale-95 ${
                                        activeFilter === opt.id
                                        ? 'border-roxy-primary bg-roxy-primary/5 text-roxy-primary'
                                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    {opt.id === 'all' && <Icons.List size={14} />}
                                    {opt.id === 'today' && <Icons.Calendar size={14} />}
                                    {opt.id === 'this_week' && <Icons.CalendarRange size={14} />}
                                    {opt.id === 'this_month' && <Icons.CalendarDays size={14} />}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Transaksi</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.data.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-800">{new Date(trx.created_at).toLocaleDateString('id-ID')}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(trx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-slate-900 font-mono">{trx.transaction_number}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs">
                                                    {(trx.customer?.name || 'W').charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{trx.customer?.name || 'Walk-in Customer'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trx.payment_method === 'cash' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {trx.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-sm font-black text-roxy-primary">{formatIDR(trx.total_amount)}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => fetchDetail(trx.id)}
                                                className="p-2 hover:bg-roxy-primary/10 text-slate-400 hover:text-roxy-primary rounded-xl transition-all"
                                            >
                                                <Icons.Eye size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {transactions.data.map((trx) => (
                            <button
                                key={trx.id}
                                onClick={() => fetchDetail(trx.id)}
                                className="w-full p-5 flex items-start gap-4 text-left active:bg-slate-50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 shrink-0">
                                    <span className="text-[10px] font-black leading-none uppercase">{new Date(trx.created_at).toLocaleString('id-ID', {month: 'short'})}</span>
                                    <span className="text-lg font-black leading-none">{new Date(trx.created_at).getDate()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h6 className="text-sm font-black text-slate-900 truncate">{trx.transaction_number}</h6>
                                        <span className="text-sm font-black text-roxy-primary ml-2 shrink-0">{formatIDR(trx.total_amount)}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 mt-1">{trx.customer?.name || 'Walk-in Customer'}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(trx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${trx.payment_method === 'cash' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {trx.payment_method}
                                        </span>
                                    </div>
                                </div>
                                <Icons.ChevronRight className="text-slate-300 mt-1 shrink-0" size={18} />
                            </button>
                        ))}
                    </div>

                    {transactions.data.length === 0 && (
                        <div className="p-16 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300">
                                <Icons.FileText size={40} />
                            </div>
                            <div>
                                <h5 className="text-lg font-black text-slate-800">Tidak ada transaksi</h5>
                                <p className="text-sm text-slate-500 mt-1">
                                    {activeFilter !== 'all' ? `Tidak ada transaksi untuk periode "${activeFilterLabel}".` : 'Mulai berjualan untuk melihat riwayat di sini.'}
                                </p>
                            </div>
                            {activeFilter !== 'all' && (
                                <button
                                    onClick={() => handleFilterSelect('all')}
                                    className="text-roxy-primary font-bold text-sm hover:underline"
                                >
                                    Tampilkan semua transaksi
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {transactions.links && transactions.links.length > 3 && (
                    <div className="flex justify-center gap-2 pb-10">
                        {transactions.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url || link.active}
                                onClick={() => router.get(link.url)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${link.active ? 'bg-roxy-primary text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                {selectedTrx && (
                    <div className="p-5 sm:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detail Transaksi</h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">{selectedTrx.transaction_number}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400">
                                <Icons.X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:gap-8 bg-slate-50 p-5 sm:p-6 rounded-[2rem] border border-slate-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pelanggan</p>
                                <p className="text-sm font-black text-slate-800">{selectedTrx.customer?.name || 'Walk-in Customer'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kasir</p>
                                <p className="text-sm font-black text-slate-800">{selectedTrx.cashier?.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu</p>
                                <p className="text-sm font-black text-slate-800">{new Date(selectedTrx.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Metode Bayar</p>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${selectedTrx.payment_method === 'cash' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {selectedTrx.payment_method}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rincian Item</p>
                            <div className="space-y-3">
                                {selectedTrx.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                {item.item_type === 'service' ? <Icons.Scissors size={20} /> : <Icons.Package size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{item.item_name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">
                                                    {item.quantity} x {formatIDR(item.unit_price)}
                                                    {item.barber && ` • Barber: ${item.barber.name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">{formatIDR(item.total_price)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold">Subtotal</span>
                                <span className="text-slate-800 font-black">{formatIDR(selectedTrx.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold">Pajak (10%)</span>
                                <span className="text-slate-800 font-black">{formatIDR(selectedTrx.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-slate-200">
                                <span className="text-lg font-black text-slate-900">Total Akhir</span>
                                <span className="text-2xl font-black text-roxy-primary">{formatIDR(selectedTrx.total_amount)}</span>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors active:scale-95">
                                <Icons.Printer size={18} />
                                Cetak Struk
                            </button>
                            <button className="flex-1 bg-teal-500 text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-teal-400 transition-colors active:scale-95">
                                <Icons.Share2 size={18} />
                                Kirim WA
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
