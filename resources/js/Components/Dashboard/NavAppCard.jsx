import React from 'react';
import { Link } from '@inertiajs/react';

export default function NavAppCard({ title, icon: Icon, href, color = 'blue' }) {
    const colorMap = {
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        indigo: 'bg-indigo-500',
        violet: 'bg-violet-500',
        teal: 'bg-teal-500',
        orange: 'bg-orange-500',
    };

    const bgColor = colorMap[color] || colorMap.blue;

    return (
        <Link 
            href={href} 
            className="flex flex-col items-center justify-center gap-3 p-4 bg-roxy-surface rounded-[2rem] border border-roxy-border shadow-sm shadow-slate-200/50 transition-all duration-200 active:scale-95 group hover:border-roxy-primary/30"
        >
            <div className={`${bgColor} p-4 rounded-3xl text-white shadow-lg shadow-inherit/20 group-hover:scale-110 transition-transform`}>
                {Icon && <Icon size={28} strokeWidth={2.5} />}
            </div>
            <span className="text-xs font-bold text-roxy-accent font-heading text-center line-clamp-1">
                {title}
            </span>
        </Link>
    );
}
