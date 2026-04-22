import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) {
    const colorClasses = {
        primary: 'text-roxy-primary bg-roxy-primary/10',
        accent: 'text-roxy-accent bg-roxy-accent/10',
        rose: 'text-rose-600 bg-rose-50',
        amber: 'text-amber-600 bg-amber-50',
    };

    const selectedColor = colorClasses[color] || colorClasses.primary;

    return (
        <div className="bg-roxy-surface p-6 rounded-2xl border border-roxy-border shadow-sm shadow-slate-200/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${selectedColor}`}>
                    {Icon && <Icon size={24} />}
                </div>
                {trend && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-lg ${trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                        {trend === 'up' ? '↑' : '↓'} {trendValue}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-roxy-textMuted font-heading uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold text-roxy-accent mt-1">{value}</p>
            </div>
        </div>
    );
}
