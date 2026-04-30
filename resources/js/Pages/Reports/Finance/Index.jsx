import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    Wallet, 
    Calendar, 
    Download, 
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    LayoutDashboard,
    Briefcase,
    ChevronDown,
    Search,
    Scissors,
    Package,
    ArrowLeft,
    Building2,
    PieChart as PieChartIcon
} from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';

export default function FinanceIndex({ filters, summary, revenue_trend, payment_methods, top_items, pending_items, branches }) {
    const { auth } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [branchId, setBranchId] = useState(filters.branch_id || '');

    const isAdmin = auth.user.role === 'super_admin' || auth.user.role === 'admin';

    const handleFilter = () => {
        router.get(route('reports.finance'), {
            start_date: startDate,
            end_date: endDate,
            branch_id: branchId
        }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = route('reports.finance.export', {
            start_date: startDate,
            end_date: endDate,
            branch_id: branchId
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    // Prepare data for Pie Chart
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const pieData = payment_methods
        .filter(item => item.payment_method && item.payment_method.trim() !== '')
        .map(item => ({
            name: item.payment_method.toUpperCase(),
            value: parseFloat(item.total)
        }));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <PageHeader 
                        title="Laporan Keuangan"
                        backHref={route('dashboard')}
                        subtitle="Analisis performa bisnis dan profitabilitas"
                    />
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                        <Download size={20} />
                        Export PDF
                    </button>
                </div>
            }
        >
            <Head title="Laporan Keuangan" />

            <div className="space-y-8 mt-8">
                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Hari Ini', value: 'today' },
                        { label: 'Kemarin', value: 'yesterday' },
                        { label: 'Minggu Ini', value: 'this_week' },
                        { label: 'Bulan Ini', value: 'this_month' },
                        { label: 'Bulan Lalu', value: 'last_month' },
                    ].map((qf) => (
                        <button
                            key={qf.value}
                            onClick={() => {
                                const now = new Date();
                                let start = new Date();
                                let end = new Date();

                                switch(qf.value) {
                                    case 'today':
                                        start = now;
                                        end = now;
                                        break;
                                    case 'yesterday':
                                        start = new Date(now);
                                        start.setDate(now.getDate() - 1);
                                        end = new Date(start);
                                        break;
                                    case 'this_week':
                                        const day = now.getDay();
                                        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                                        start = new Date(now.setDate(diff));
                                        end = new Date();
                                        break;
                                    case 'this_month':
                                        start = new Date(now.getFullYear(), now.getMonth(), 1);
                                        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                        break;
                                    case 'last_month':
                                        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                        end = new Date(now.getFullYear(), now.getMonth(), 0);
                                        break;
                                }

                                const startStr = start.toISOString().split('T')[0];
                                const endStr = end.toISOString().split('T')[0];
                                
                                setStartDate(startStr);
                                setEndDate(endStr);
                                
                                // Direct router call for better UX
                                router.get(route('reports.finance'), {
                                    start_date: startStr,
                                    end_date: endStr,
                                    branch_id: branchId
                                }, { preserveState: true });
                            }}
                            className="px-4 py-2 bg-white/50 backdrop-blur-md border border-white text-slate-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                        >
                            {qf.label}
                        </button>
                    ))}
                </div>

                {/* Filter Bar */}
                <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-sm flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Dari Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Sampai Tanggal</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                            />
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cabang</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select 
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 appearance-none"
                                >
                                    <option value="">Semua Cabang</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={handleFilter}
                        className="bg-indigo-600 text-white p-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        <Search size={24} />
                    </button>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Revenue Card */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp size={80} className="text-indigo-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit">
                                    <TrendingUp size={24} />
                                </div>
                                {summary.pending_revenue > 0 && (
                                    <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                                        ADA PENDING
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendapatan Aktual (Selesai)</p>
                            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(summary.actual_revenue)}</h3>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400">Potensi (Gross):</span>
                                <span className="text-xs font-black text-slate-600">{formatCurrency(summary.total_revenue)}</span>
                            </div>
                            {summary.pending_revenue > 0 && (
                                <div className="mt-1 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-rose-400">Total Pending:</span>
                                    <span className="text-xs font-black text-rose-500">-{formatCurrency(summary.pending_revenue)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expenses Card */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingDown size={80} className="text-rose-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mb-4">
                                <TrendingDown size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran</p>
                            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(summary.total_expenses)}</h3>
                        </div>
                    </div>

                    {/* Commissions Card */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Briefcase size={80} className="text-amber-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
                                <Briefcase size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Komisi Barber</p>
                            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(summary.total_commissions)}</h3>
                        </div>
                    </div>

                    {/* Net Profit Card */}
                    <div className="bg-indigo-600 p-6 rounded-[32px] shadow-xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet size={80} className="text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="p-3 bg-white/20 text-white rounded-2xl w-fit mb-4 backdrop-blur-md">
                                <Wallet size={24} />
                            </div>
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Laba Bersih (Aktual)</p>
                            <h3 className="text-2xl font-black text-white">{formatCurrency(summary.net_profit)}</h3>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Trend Chart */}
                    <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Tren Pendapatan</h3>
                                <p className="text-slate-500 text-sm font-medium">Perkembangan harian dalam periode terpilih</p>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-xl">
                                <ArrowUpRight size={16} />
                                <span>Realtime</span>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenue_trend}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 10}}
                                        tickFormatter={(date) => {
                                            const d = new Date(date);
                                            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                                        }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontWeight: 600, fontSize: 10}}
                                        tickFormatter={(value) => `Rp ${value / 1000}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                        formatter={(value) => formatCurrency(value)}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Payment Methods Chart */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-sm">
                        <div className="mb-8 text-center sm:text-left">
                            <h3 className="text-xl font-black text-slate-900">Metode Pembayaran</h3>
                            <p className="text-slate-500 text-sm font-medium">Distribusi nominal transaksi</p>
                        </div>
                        <div className="h-[300px] w-full flex justify-center items-center">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                        />
                                        <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: '20px', fontWeight: 'bold', fontSize: '10px'}} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-slate-400 text-sm font-bold flex flex-col items-center gap-2">
                                    <PieChartIcon size={48} className="opacity-20" />
                                    <span>Tidak ada data</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Top Items & Detail Table */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                    {/* Top 5 Items */}
                    <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-[40px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900">Paling Laris</h3>
                            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                <PieChartIcon size={20} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            {top_items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                                        idx === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{item.item_name}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.qty} Terjual</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900 text-sm">{formatCurrency(item.total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Items Breakdown */}
                    {pending_items && pending_items.length > 0 ? (
                        <div className="bg-rose-50 border border-rose-100 p-8 rounded-[40px] shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-rose-900">Item/Layanan Pending</h3>
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl animate-pulse">
                                    <Scissors size={20} />
                                </div>
                            </div>
                            <div className="space-y-6">
                                {pending_items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-rose-200/50">
                                        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-rose-900 text-sm truncate">{item.item_name}</h4>
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">{item.qty} Belum Selesai</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-rose-900 text-sm">{formatCurrency(item.total)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-rose-600 text-white rounded-2xl mt-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total Nilai Tertunda</p>
                                    <p className="text-xl font-black">{formatCurrency(pending_items.reduce((acc, curr) => acc + parseFloat(curr.total), 0))}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-teal-50 border border-teal-100 p-10 rounded-[40px] shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4">
                                <Package size={32} />
                            </div>
                            <h3 className="text-xl font-black text-teal-900">Semua Transaksi Selesai</h3>
                            <p className="text-teal-600/70 font-medium text-sm mt-2">Tidak ada item atau layanan yang berstatus pending pada periode ini.</p>
                        </div>
                    )}

                    {/* Summary Recommendation/Status */}
                    <div className="bg-slate-900 p-10 rounded-[40px] shadow-xl relative overflow-hidden text-white flex flex-col justify-center">
                        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[100px] rounded-full"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                                <TrendingUp className="text-indigo-400" />
                                Status Performa
                            </h3>
                            <p className="text-slate-400 font-medium mb-8 text-lg leading-relaxed">
                                {summary.net_profit > 0 
                                    ? `Bisnis sedang dalam kondisi profit. Rasio laba bersih (aktual) terhadap omzet aktual adalah ${((summary.net_profit / summary.actual_revenue) * 100 || 0).toFixed(1)}%.`
                                    : "Omzet belum menutupi pengeluaran operasional dan komisi. Evaluasi pengeluaran Anda."}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rasio Pengeluaran</p>
                                    <p className="text-xl font-black text-rose-400">{((summary.total_expenses / summary.total_revenue) * 100).toFixed(1)}%</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rasio Komisi</p>
                                    <p className="text-xl font-black text-amber-400">{((summary.total_commissions / summary.total_revenue) * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
