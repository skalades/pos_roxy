import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import * as Icons from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function CommissionIndex({ summary, filters }) {
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: filters.start_date,
        end: filters.end_date
    });

    const filterOptions = [
        { id: 'today', name: 'Hari Ini', icon: <Icons.Calendar size={16} /> },
        { id: 'this_week', name: 'Minggu Ini', icon: <Icons.CalendarRange size={16} /> },
        { id: 'this_month', name: 'Bulan Ini', icon: <Icons.CalendarDays size={16} /> },
        { id: 'last_month', name: 'Bulan Lalu', icon: <Icons.History size={16} /> },
        { id: 'custom', name: 'Custom Range', icon: <Icons.Settings2 size={16} /> },
    ];

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
        <AuthenticatedLayout>
            <Head title="Ringkasan Komisi Saya" />

            <div className="min-h-screen bg-slate-50 pb-40">
                {/* Header Section */}
                <div className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm border-b border-slate-100 relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-64 h-64 bg-roxy-primary/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => window.history.back()}
                                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
                                >
                                    <Icons.ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Komisi Saya</h1>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                        {filterOptions.find(f => f.id === filters.current)?.name}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-90 transition-transform"
                            >
                                <Icons.Filter size={20} />
                            </button>
                        </div>

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
                                <h3 className="text-2xl font-black">{summary.total_services} <span className="text-xs opacity-60">Pcs</span></h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Selection Modal-like Overlay */}
                {showFilters && (
                    <div className="px-6 -mt-6 relative z-20">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 border border-slate-100 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Pilih Periode</h4>
                                <button onClick={() => setShowFilters(false)} className="p-2 text-slate-400"><Icons.X size={18} /></button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {filterOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleFilterChange(option.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${
                                            filters.current === option.id 
                                            ? 'border-roxy-primary bg-roxy-primary/5 text-roxy-primary' 
                                            : 'border-slate-50 bg-slate-50 text-slate-400'
                                        }`}
                                    >
                                        {option.icon}
                                        {option.name}
                                    </button>
                                ))}
                            </div>

                            {filters.current === 'custom' && (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mulai</label>
                                            <input 
                                                type="date" 
                                                value={dateRange.start}
                                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                                className="w-full bg-slate-50 border-none rounded-xl font-bold text-sm" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sampai</label>
                                            <input 
                                                type="date" 
                                                value={dateRange.end}
                                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                                className="w-full bg-slate-50 border-none rounded-xl font-bold text-sm" 
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={applyCustomFilter}
                                        className="w-full bg-roxy-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-roxy-primary/20"
                                    >
                                        Terapkan Filter
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* List Summary */}
                <div className="px-6 mt-8 space-y-8">
                    {summary.daily_breakdown.length > 0 ? (
                        summary.daily_breakdown.map((day, idx) => (
                            <div key={day.date} className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-roxy-primary rounded-full animate-pulse"></div>
                                        <h4 className="font-black text-slate-800 text-sm">{day.formatted_date}</h4>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">
                                        {day.total_services} Layanans
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {day.items.map(item => (
                                        <div key={item.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-transform">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-roxy-primary/10 group-hover:text-roxy-primary transition-colors">
                                                    <Icons.User size={20} />
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
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <Icons.Inbox size={64} strokeWidth={1} className="mb-4" />
                            <p className="font-bold text-slate-500">Belum ada data komisi di periode ini</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Sticky Summary */}
            {summary.total_commission > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-30">
                    <div className="bg-slate-900 text-white px-8 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center justify-between border-t border-white/10 backdrop-blur-xl rounded-t-[2.5rem]">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Estimasi Pendapatan</p>
                            <h3 className="text-2xl font-black text-roxy-primary leading-none">{formatIDR(summary.total_commission)}</h3>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1 text-right">Status Profit</p>
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
