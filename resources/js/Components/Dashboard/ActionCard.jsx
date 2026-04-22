import React from 'react';
import { Link } from '@inertiajs/react';

export default function ActionCard({ title, description, icon: Icon, href, color = 'primary' }) {
    const colorClasses = {
        primary: 'bg-roxy-primary text-white hover:bg-roxy-primaryHover',
        white: 'bg-white text-roxy-accent border border-roxy-border hover:bg-slate-50',
    };

    const selectedColor = colorClasses[color] || colorClasses.primary;

    return (
        <Link 
            href={href} 
            className={`${selectedColor} p-5 rounded-2xl flex items-center gap-4 transition-all duration-200 active:scale-95 shadow-sm group`}
        >
            <div className={`p-3 rounded-xl ${color === 'primary' ? 'bg-white/20' : 'bg-roxy-primary/10 text-roxy-primary'} group-hover:scale-110 transition-transform`}>
                {Icon && <Icon size={24} />}
            </div>
            <div>
                <p className="font-bold text-sm leading-tight">{title}</p>
                <p className={`text-xs mt-1 ${color === 'primary' ? 'text-white/80' : 'text-roxy-textMuted'}`}>{description}</p>
            </div>
        </Link>
    );
}
