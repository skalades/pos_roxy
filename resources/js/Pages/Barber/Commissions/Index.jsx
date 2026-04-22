import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import * as Icons from 'lucide-react';
import { formatIDR } from '@/utils/currency';

const FILTER_OPTIONS = [
    { id: 'today', name: 'Hari Ini', icon: 'Calendar' },
    { id: 'this_week', name: 'Minggu Ini', icon: 'CalendarRange' },
    { id: 'this_month', name: 'Bulan Ini', icon: 'CalendarDays' },
    { id: 'last_month', name: 'Bulan Lalu', icon: 'History' },
    { id: 'custom', name: 'Custom Range', icon: 'Settings2' },
];

export default function CommissionIndex({ summary, filters }) {
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: filters.start_date || '',
        end: filters.end_date || ''
    });

    const currentFilterName = FILTER_OPTIONS.find(f => f.id === filters.current)?.name || 'Hari Ini';

    const handleFilterChange = (id) => {
        if (id === 'custom') {
            setShowFilters(true);
            return;
        }
        router.get(route('barber.commissions'), { filter: id }, { preserveState: true });
        setShowFilters(false);
    };

    const applyCustomFilter = () => {
        router.get(route('barber.commissions'), {
            filter: 'custom',
            start_date: dateRange.start,
            end_date: dateRange.end
        });
        setShowFilters(false);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-roxy-primary rounded-full shadow-[0_0_15px_rgba(13,148,136,0.5)]"></div>
                        <h2 className="text-2xl sm:text-3xl font-black font-heading leading-tight text-roxy-accent tracking-tight">
                            Komisi Saya
                        </h2>
                        <p className="text-sm text-roxy-text-muted mt-1 font-medium">
                            Periode: <span className="text-roxy-primary font-bold">{currentFilterName}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                                showFilters
                                ? 'bg-roxy-primary text-white shadow-lg shadow-roxy-primary/20'
                                : 'bg-white/50 backdrop-blur-sm border border-white text-slate-600 shadow-sm'
                            }`}
                        >
                            <Icons.Filter size={16} />
                            <span className="hidden sm:inline">Filter Periode</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Ringkasan Komisi Saya" />

            <div className="max-w-3xl mx-auto space-y-6 pb-32">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-roxy-primary rounded-[2rem] p-6 text-white shadow-xl shadow-roxy-primary/20 relative overflow-hidden group">
                        <Icons.Wallet className="absolute -right-2 -bottom-2 text-white/10 group-hover:scale-110 transition-transform" size={80} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Total Komisi</p>
                        <h3 className="text-xl font-black truncate">{formatIDR(summary.total_commission)}</h3>
                    </div>
                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                        <Icons.CheckCircle2 className="absolute -right-2 -bottom-2 text-white/10 group-hover:scale-110 transition-transform" size={80} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">Total Selesai</p>
                        <h3 className="text-2xl font-black">{summary.total_services} <span className="text-xs opacity-60">Layanan</span></h3>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="bg-white rounded-[2.5rem] shadow-xl p-6 border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between mb-5">
                            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Pilih Periode</h4>
                            <button onClick={() => setShowFilters(false)} className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
                                <Icons.X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {FILTER_OPTIONS.map(option => {
                                const Icon = Icons[option.icon];
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => handleFilterChange(option.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-xs active:scale-95 ${
                                            filters.current === option.id
                                            ? 'border-roxy-primary bg-roxy-primary/5 text-roxy-primary'
                                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'
                                        }`}
                                    >
                                        {Icon && <Icon size={16} />}
                                        {option.name}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Date Range */}
                        {filters.current === 'custom' && (
                            <div className="space-y-4 mt-5 pt-5 border-t border-slate-100 animate-in fade-in duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mulai</label>
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm p-3"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sampai</label>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm p-3"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={applyCustomFilter}
                                    className="w-full bg-roxy-primary text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-roxy-primary/20 active:scale-95 transition-transform"
                                >
                                    Terapkan Filter
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Daily Breakdown List */}
                {summary.daily_breakdown.length > 0 ? (
                    <div className="space-y-8">
                        {summary.daily_breakdown.map((day) => (
                            <div key={day.date} className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-roxy-primary rounded-full animate-pulse"></div>
                                        <h4 className="font-black text-slate-800 text-sm">{day.formatted_date}</h4>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">
                                        {day.total_services} Layanan
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {day.items.map(item => (
                                        <div
                                            key={item.id}
                                            className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-transform"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-roxy-primary/10 group-hover:text-roxy-primary transition-colors">
                                                    <Icons.Scissors size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-slate-800 text-sm">{item.service_name}</h5>
                                                    <p className="text-[10px] text-slate-400 font-bold">{item.time} WIB</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">{formatIDR(item.commission)}</p>
                                                <p className="text-[10px] text-emerald-500 font-bold">Terverifikasi</p>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-slate-900/5 rounded-2xl p-4 flex justify-between items-center border border-dashed border-slate-200">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Hari Ini</span>
                                        <span className="font-black text-slate-900 text-sm">{formatIDR(day.total_commission)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-4">
                            <Icons.Inbox size={40} strokeWidth={1.5} />
                        </div>
                        <p className="font-bold text-slate-500">Belum ada data komisi</p>
                        <p className="text-sm text-slate-400 mt-1">untuk periode "{currentFilterName}"</p>
                    </div>
                )}
            </div>

            {/* Bottom Sticky Summary — fixed, outside normal flow */}
            {summary.total_commission > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-30">
                    <div className="bg-slate-900 text-white px-6 sm:px-8 py-5 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex items-center justify-between border-t border-white/10 rounded-t-[2.5rem]">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Estimasi Pendapatan</p>
                            <h3 className="text-2xl font-black text-roxy-primary leading-none">{formatIDR(summary.total_commission)}</h3>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1 text-right">Status</p>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <p className="text-sm font-bold text-white uppercase tracking-tighter">Sudah Final</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
