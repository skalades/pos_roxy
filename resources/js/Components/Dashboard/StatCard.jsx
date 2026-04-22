import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary' }) {
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
        <div className="relative group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(13,148,136,0.05)] transition-all duration-500 hover:-translate-y-1">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${style.bg} group-hover:scale-110 transition-transform duration-500`}>
                    {Icon && <Icon className={style.icon} size={28} strokeWidth={2.5} />}
                </div>
                <div className="flex flex-col">
                    <p className="text-[11px] font-bold text-roxy-text-muted uppercase tracking-[0.15em] font-heading">{title}</p>
                    <p className="text-2xl font-black text-roxy-accent mt-0.5 tracking-tight">{value}</p>
                </div>
            </div>
            
            {/* Decorative element */}
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className={`w-12 h-12 rounded-full blur-2xl ${color === 'primary' ? 'bg-teal-400/20' : 'bg-slate-400/20'}`}></div>
            </div>
        </div>
    );
}
