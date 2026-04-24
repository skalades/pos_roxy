import { 
    TrendingUp, 
    Users, 
    ShoppingCart, 
    DollarSign, 
    Package, 
    Wallet, 
    CheckCircle, 
    Calculator,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export default function StatCard({ title, value, icon: iconName, color = 'teal', trend }) {
    const icons = {
        TrendingUp,
        Users,
        ShoppingCart,
        DollarSign,
        Package,
        Wallet,
        CheckCircle,
        Calculator
    };

    const Icon = icons[iconName] || TrendingUp;

    const colorVariants = {
        teal: 'bg-teal-50 text-teal-600 border-teal-100 shadow-teal-500/10',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10',
        blue: 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/10',
        rose: 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/10',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/10',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-500/10',
        slate: 'bg-slate-50 text-slate-600 border-slate-100 shadow-slate-500/10',
    };

    const variant = colorVariants[color] || colorVariants.teal;

    return (
        <div className="relative group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl ${variant} border flex items-center justify-center group-hover:scale-110 transition-transform duration-500 z-10`}>
                    <Icon size={26} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
                        {trend && (
                            <span className={`flex items-center text-[10px] font-black ${trend.type === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {trend.type === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {trend.value}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Premium Decorative element */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none"></div>
        </div>
    );
}
