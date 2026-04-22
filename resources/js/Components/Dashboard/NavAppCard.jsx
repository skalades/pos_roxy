import React from 'react';
import { Link } from '@inertiajs/react';

export default function NavAppCard({ title, icon: Icon, href, color = 'teal' }) {
    const colorVariants = {
        teal: 'from-teal-400 to-teal-600 shadow-teal-500/25',
        emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-500/25',
        amber: 'from-amber-400 to-amber-600 shadow-amber-500/25',
        blue: 'from-blue-400 to-blue-600 shadow-blue-500/25',
        indigo: 'from-indigo-400 to-indigo-600 shadow-indigo-500/25',
        violet: 'from-violet-400 to-violet-600 shadow-violet-500/25',
        rose: 'from-rose-400 to-rose-600 shadow-rose-500/25',
    };

    const gradientClass = colorVariants[color] || colorVariants.teal;

    return (
        <Link 
            href={href} 
            className="group flex flex-col items-center justify-center p-5 bg-white rounded-[2.5rem] border border-slate-50 shadow-[0_10px_40px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1.5"
        >
            <div className={`w-16 h-16 rounded-[1.75rem] bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-500 ease-out`}>
                {Icon && <Icon size={32} strokeWidth={2.2} />}
            </div>
            <span className="text-[13px] font-bold text-roxy-text-main text-center leading-tight group-hover:text-roxy-primary transition-colors">
                {title}
            </span>
        </Link>
    );
}
