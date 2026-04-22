import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import StatCard from '@/Components/Dashboard/StatCard';
import NavAppCard from '@/Components/Dashboard/NavAppCard';
import * as Icons from 'lucide-react';

import React, { useState, useEffect } from 'react';

export default function Dashboard({ config }) {
    const { auth } = usePage().props;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Resolve icon component from name
    const getIcon = (name) => {
        return Icons[name] || Icons.HelpCircle;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-roxy-primary rounded-full shadow-[0_0_15px_rgba(13,148,136,0.5)]"></div>
                        <h2 className="text-3xl font-black font-heading leading-tight text-roxy-accent tracking-tight">
                            {config.title}
                        </h2>
                        <p className="text-sm text-roxy-text-muted mt-1 font-medium">
                            {formatDate(currentTime)} • <span className="text-roxy-primary font-bold">{formatTime(currentTime)}</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <div className="bg-white/50 backdrop-blur-sm border border-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                             <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{auth.user.name}</span>
                         </div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-10">
                {/* Premium Stats Section */}
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                    {config.stats.map((stat, index) => (
                        <div key={index} className="min-w-[200px] flex-1">
                            <StatCard 
                                title={stat.title} 
                                value={stat.value} 
                                icon={getIcon(stat.icon)}
                                color={stat.color}
                            />
                        </div>
                    ))}
                </div>

                {/* APP GRID SECTION - Modern Icon Style */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold font-heading text-roxy-accent flex items-center gap-2">
                             Aplikasi Utama
                             <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Tools</span>
                         </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {config.menu_items.map((item, index) => (
                            <NavAppCard 
                                key={index}
                                title={item.title} 
                                icon={getIcon(item.icon)} 
                                href={item.href} 
                                color={item.color}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Status Shift Card - Dark Premium Style */}
                {(auth.user.role === 'cashier' || auth.user.role === 'super_admin') && (
                    <div className="relative group overflow-hidden bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20">
                        {/* Decorative Background for Card */}
                        <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-teal-500/10 blur-[80px] rotate-12 pointer-events-none group-hover:bg-teal-500/20 transition-colors duration-700"></div>
                        
                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center ${config.active_shift ? 'text-emerald-400' : 'text-teal-400'}`}>
                                    {config.active_shift ? <Icons.CheckCircle size={28} /> : <Icons.Store size={28} />}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold font-heading text-white tracking-tight">Status Shift Operasional</h4>
                                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${config.active_shift ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                                        {config.active_shift 
                                            ? `Shift aktif sejak ${new Date(config.active_shift.opened_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                                            : 'Laci kasir belum dibuka hari ini.'}
                                    </p>
                                </div>
                            </div>
                            
                            {config.active_shift ? (
                                <a href={route('pos.index')} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-2xl text-sm font-black transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95 uppercase tracking-widest text-center">
                                    Buka POS
                                </a>
                            ) : (
                                <a href={route('shifts.index')} className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-900 px-8 py-4 rounded-2xl text-sm font-black transition-all duration-300 shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 active:scale-95 uppercase tracking-widest text-center">
                                    Buka Shift
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Extra space for bottom nav */}
                <div className="h-12"></div>
            </div>
        </AuthenticatedLayout>
    );
}
