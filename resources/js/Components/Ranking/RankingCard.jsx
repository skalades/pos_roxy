import React from 'react';
import { Crown, ArrowRight } from 'lucide-react';

export default function RankingCard({ 
    title, 
    topName, 
    topValue, 
    icon: Icon, 
    color = 'amber', 
    onClick,
    subtitle
}) {
    const colorVariants = {
        amber: 'from-amber-400 to-amber-600 shadow-amber-200',
        blue: 'from-blue-400 to-blue-600 shadow-blue-200',
        rose: 'from-rose-400 to-rose-600 shadow-rose-200',
        emerald: 'from-emerald-400 to-emerald-600 shadow-emerald-200',
        indigo: 'from-indigo-400 to-indigo-600 shadow-indigo-200',
        violet: 'from-violet-400 to-violet-600 shadow-violet-200',
    };

    const gradientClass = colorVariants[color] || colorVariants.amber;

    return (
        <div 
            onClick={onClick}
            className="group relative cursor-pointer overflow-hidden bg-white border-2 border-slate-900/5 p-8 rounded-[3rem] shadow-2xl shadow-slate-200/50 hover:shadow-slate-300/50 transition-all duration-500 hover:-translate-y-2 active:scale-95"
        >
            {/* Background Decorative Gradient */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${gradientClass} opacity-[0.03] blur-[80px] -mr-32 -mt-32 group-hover:opacity-[0.08] transition-opacity duration-700`}></div>
            
            <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white shadow-lg`}>
                        <Icon size={28} strokeWidth={2.5} />
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peringkat #1</span>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
                    <div className="mt-2 flex items-center gap-3">
                        <Crown className="text-amber-500 fill-amber-500 shrink-0" size={24} />
                        <h3 className="text-2xl font-black text-slate-900 truncate group-hover:text-roxy-primary transition-colors">
                            {topName || 'Belum ada data'}
                        </h3>
                    </div>
                    {subtitle && (
                        <p className="text-sm font-bold text-slate-500 mt-1">{subtitle}</p>
                    )}
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Performa</span>
                        <span className="text-xl font-black text-slate-900">{topValue}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500`}>
                        <ArrowRight size={20} />
                    </div>
                </div>
            </div>
        </div>
    );
}
