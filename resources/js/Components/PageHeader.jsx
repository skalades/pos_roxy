import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, LogOut } from 'lucide-react';

/**
 * PageHeader — Komponen header standar untuk semua halaman Roxy POS.
 * Menggantikan pola header duplikat di 7+ halaman.
 *
 * @param {string} title - Judul halaman
 * @param {string} subtitle - Subjudul/deskripsi
 * @param {string} backHref - URL untuk tombol kembali (default: /dashboard)
 * @param {string} badge - Teks badge (misal: "Shift Aktif")
 * @param {string} badgeColor - Warna badge: 'emerald', 'amber', 'rose', 'blue'
 * @param {React.ReactNode} action - Elemen aksi di sebelah kanan (tombol dll)
 * @param {boolean} showClock - Tampilkan jam real-time
 * @param {boolean} showLogout - Tampilkan tombol logout
 */
export default function PageHeader({
    title,
    subtitle,
    backHref = '/dashboard',
    badge,
    badgeColor = 'emerald',
    action,
    showClock = false,
    showLogout = false,
}) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!showClock) return;
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [showClock]);

    const badgeColors = {
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-100 text-amber-700 border-amber-200',
        rose: 'bg-rose-100 text-rose-700 border-rose-200',
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        teal: 'bg-teal-100 text-teal-700 border-teal-200',
        primary: 'bg-roxy-primary/10 text-roxy-primary border-roxy-primary/20',
    };

    return (
        <div className="mb-10 landscape:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 landscape:flex-row landscape:items-center">
                <div className="flex items-center gap-5">
                    {backHref && (
                        <Link
                            href={backHref}
                            className="p-3.5 bg-white border border-slate-100 rounded-[1.25rem] text-slate-400 hover:text-roxy-primary hover:border-roxy-primary/30 shadow-sm transition-all hover:scale-110 active:scale-95 group"
                        >
                            <ArrowLeft size={22} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                    )}
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-14 bg-roxy-primary rounded-full shadow-[0_0_20px_rgba(13,148,136,0.6)]"></div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl landscape:text-2xl font-black text-slate-900 tracking-tighter leading-tight font-heading">
                                {title}
                            </h1>
                            {badge && (
                                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border ${badgeColors[badgeColor] || badgeColors.primary}`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-sm text-slate-500 font-bold mt-1.5 landscape:text-xs flex items-center gap-2">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {showClock && (
                        <div className="bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-sm text-right hidden sm:block landscape:block">
                            <p className="text-xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                    )}
                    {showLogout && (
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button"
                            className="bg-white/90 hover:bg-rose-50 border border-slate-100 p-3.5 rounded-[1.25rem] text-rose-600 shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 group"
                            title="Logout"
                        >
                            <LogOut className="group-hover:rotate-12 transition-transform" size={20} />
                        </Link>
                    )}
                    {action}
                </div>
            </div>
        </div>
    );
}
