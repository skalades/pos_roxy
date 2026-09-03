import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import StatCard from '@/Components/Dashboard/StatCard';
import NavAppCard from '@/Components/Dashboard/NavAppCard';
import PageHeader from '@/Components/PageHeader';
import { Clock, CheckCircle, Store } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '@/utils/datetime';

export default function Dashboard({ config }) {
    const { auth } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title={`Halo, ${auth.user.name.split(' ')[0]}!`}
                    subtitle={`Dashboard Operasional • ${auth.user.role}`}
                    backHref={null}
                    showClock={true}
                    showLogout={true}
                />
            }
        >
            <Head title="Dashboard Operasional" />

            <div className="max-w-7xl mx-auto space-y-10">
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {config.stats.map((stat, index) => (
                        <StatCard 
                            key={index}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                            trend={stat.trend}
                        />
                    ))}
                </div>

                {/* Branch Summaries for Super Admin */}
                {config.branch_summaries && config.branch_summaries.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <div className="w-1.5 h-6 bg-roxy-primary rounded-full"></div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Ringkasan Per Cabang</h3>
                            <div className="h-px flex-1 bg-slate-100"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {config.branch_summaries.map((branch, index) => (
                                <div key={index} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-black uppercase shadow-inner border border-slate-100">
                                            {branch.name.charAt(0)}
                                        </div>
                                        <h4 className="font-black text-slate-800 text-lg tracking-tight">{branch.name}</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
                                            <span className="font-black text-emerald-600">{branch.revenue}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customers</span>
                                            <span className="font-black text-blue-600">{branch.customers}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                                                <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">On Time</span>
                                                <span className="font-black text-emerald-600">{branch.ontime}</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-between p-3 bg-rose-50 rounded-2xl border border-rose-100/50">
                                                <span className="text-[10px] font-black text-rose-600/70 uppercase tracking-widest">Telat</span>
                                                <span className="font-black text-rose-600">{branch.late}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Navigation Grid */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-1.5 h-6 bg-roxy-primary rounded-full"></div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Menu Utama</h3>
                        <div className="h-px flex-1 bg-slate-100"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {config.nav_cards.map((item, index) => (
                            <NavAppCard 
                                key={index}
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                                href={item.href}
                                color={item.color}
                            />
                        ))}
                        {/* Dynamic Injection of Expenses for operational ease */}
                        {auth.user.role === 'cashier' && config.expenses_enabled && (
                            <NavAppCard 
                                icon="Banknote" 
                                title="Pengeluaran" 
                                description="Catat operasional"
                                href={route('expenses.index')} 
                                color="rose"
                            />
                        )}
                    </div>
                </div>
                
                {/* Status Shift Card - Premium Modern Style */}
                {auth.user.role === 'cashier' && (
                    <div className="relative group overflow-hidden bg-white border-2 border-slate-900/5 p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50">
                        {/* Decorative Gradient Background */}
                        <div className={`absolute top-0 right-0 w-80 h-80 ${config.active_shift ? 'bg-emerald-500/5' : 'bg-rose-500/5'} blur-[100px] -mr-40 -mt-40 transition-colors duration-700`}></div>
                        
                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-[1.75rem] ${config.active_shift ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} border-2 flex items-center justify-center shadow-inner`}>
                                    {config.active_shift ? <CheckCircle size={32} strokeWidth={2.5} /> : <Store size={32} strokeWidth={2.5} />}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Status Shift Operasional</h4>
                                    <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${config.active_shift ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></span>
                                        {config.active_shift 
                                            ? `Shift aktif sejak ${new Date(config.active_shift.opened_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                                            : 'Laci kasir belum dibuka hari ini.'}
                                    </p>
                                </div>
                            </div>
                            
                            {config.active_shift ? (
                                <a href={route('pos.index')} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-2xl text-xs font-black transition-all duration-300 shadow-xl shadow-slate-900/20 active:scale-95 uppercase tracking-[0.2em] text-center">
                                    Mulai POS
                                </a>
                            ) : (
                                <a href={route('shifts.index')} className="w-full sm:w-auto bg-roxy-primary hover:bg-teal-600 text-white px-10 py-5 rounded-2xl text-xs font-black transition-all duration-300 shadow-xl shadow-roxy-primary/20 active:scale-95 uppercase tracking-[0.2em] text-center">
                                    Buka Shift Baru
                                </a>
                            )}
                        </div>
                    </div>
                )}


            </div>
        </AuthenticatedLayout>
    );
}
