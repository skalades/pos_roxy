import React from 'react';
import { Link } from '@inertiajs/react';
import * as Icons from 'lucide-react';

export default function NavAppCard({ title, description, icon: iconName, href, color = 'teal' }) {
    // Resolve icon component
    const Icon = Icons[iconName] || Icons.HelpCircle;

    const colorVariants = {
        teal: 'from-teal-500 to-teal-700 shadow-teal-500/25',
        emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/25',
        amber: 'from-amber-500 to-amber-700 shadow-amber-500/25',
        blue: 'from-blue-500 to-blue-700 shadow-blue-500/25',
        indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-500/25',
        violet: 'from-violet-500 to-violet-700 shadow-violet-500/25',
        rose: 'from-rose-500 to-rose-700 shadow-rose-500/25',
    };

    const gradientClass = colorVariants[color] || colorVariants.teal;

    return (
        <Link 
            href={href} 
            className="group flex flex-col items-center justify-center p-6 bg-white rounded-[2.5rem] border border-slate-50 shadow-[0_10px_40px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
        >
            {/* Hover Background Accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500`}></div>
            
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.75rem] bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-500 ease-out z-10`}>
                <Icon size={28} strokeWidth={2.5} />
            </div>
            
            <div className="text-center z-10">
                <span className="block text-[13px] sm:text-sm font-black text-slate-800 leading-tight group-hover:text-roxy-primary transition-colors">
                    {title}
                </span>
                {description && (
                    <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                        {description}
                    </span>
                )}
            </div>
        </Link>
    );
}
