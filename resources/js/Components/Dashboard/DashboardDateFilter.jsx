import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Calendar, CalendarRange, CalendarDays, SlidersHorizontal, X, ArrowRight, Check } from 'lucide-react';

const FILTER_TABS = [
    { id: 'today', label: 'Hari Ini', icon: Calendar },
    { id: 'this_week', label: 'Minggu Ini', icon: CalendarRange },
    { id: 'this_month', label: 'Bulan Ini', icon: CalendarDays },
    { id: 'custom', label: 'Custom Range', icon: SlidersHorizontal },
];

export default function DashboardDateFilter({ filters = {} }) {
    const activePeriod = filters.period || 'today';
    const [showCustomModal, setShowCustomModal] = useState(activePeriod === 'custom');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleSelectPeriod = (periodId) => {
        if (periodId === 'custom') {
            setShowCustomModal(true);
            return;
        }

        setShowCustomModal(false);
        router.get(
            route('dashboard'),
            { period: periodId },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleApplyCustom = (e) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        router.get(
            route('dashboard'),
            {
                period: 'custom',
                start_date: startDate,
                end_date: endDate,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    return (
        <div className="space-y-3">
            {/* Filter Pills Bar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto max-w-full">
                    {FILTER_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activePeriod === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleSelectPeriod(tab.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 whitespace-nowrap ${
                                    isActive
                                        ? 'bg-roxy-primary text-white shadow-md shadow-roxy-primary/20'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={14} strokeWidth={2.5} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Periode Info Tag */}
                {filters.formatted_range && (
                    <div className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-roxy-primary animate-pulse"></span>
                        <span>{filters.formatted_range}</span>
                    </div>
                )}
            </div>

            {/* Custom Date Range Panel */}
            {showCustomModal && (
                <form
                    onSubmit={handleApplyCustom}
                    className="p-5 bg-white border border-slate-100 rounded-3xl shadow-lg shadow-slate-100/80 animate-in slide-in-from-top-2 duration-300"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal size={16} className="text-roxy-primary" />
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                                Tentukan Rentang Tanggal
                            </h4>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCustomModal(false)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Mulai Tanggal
                            </label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-roxy-primary focus:ring-roxy-primary"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Sampai Tanggal
                            </label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:border-roxy-primary focus:ring-roxy-primary"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowCustomModal(false)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={!startDate || !endDate}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-roxy-primary hover:bg-teal-700 shadow-md shadow-roxy-primary/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <Check size={14} strokeWidth={3} />
                            <span>Terapkan Rentang</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
