import React from 'react';
import * as Icons from 'lucide-react';

export default function StatCard({ title, value, icon: iconName, color = 'primary' }) {
    // Resolve icon component
    const Icon = Icons[iconName] || Icons.TrendingUp;

    const colorStyles = {
        primary: {
            bg: 'bg-teal-50',
            icon: 'text-teal-600',
            accent: 'bg-teal-600/10'
        },
        accent: {
            bg: 'bg-slate-50',
            icon: 'text-slate-900',
            accent: 'bg-slate-900/10'
        },
    };

    const style = colorStyles[color] || colorStyles.primary;

    return (
        <div className="relative group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(13,148,136,0.05)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl ${style.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 z-10`}>
                    <Icon className={style.icon} size={28} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-heading leading-none mb-1.5">{title}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
                </div>
            </div>
            
            {/* Premium Decorative element */}
            <div className="absolute -top-6 -right-6 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                 <div className={`w-24 h-24 rounded-full blur-3xl ${color === 'primary' ? 'bg-teal-400/20' : 'bg-slate-400/20'}`}></div>
            </div>
        </div>
    );
}
