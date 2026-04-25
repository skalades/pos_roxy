import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import { 
    Wallet, 
    Calendar, 
    ChevronRight, 
    User as UserIcon, 
    TrendingUp, 
    AlertCircle, 
    CheckCircle2, 
    Filter,
    Download,
    DollarSign,
    Clock
} from 'lucide-react';
import { formatIDR } from '@/utils/currency';
import PageHeader from '@/Components/PageHeader';

export default function Index({ payrollData, branches, filters }) {
    const [filterType, setFilterType] = useState(filters.start_date && filters.end_date && !filters.period ? 'range' : 'monthly');
    const [period, setPeriod] = useState(filters.period || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');

    const handleFilter = () => {
        const params = { branch_id: branchId };
        if (filterType === 'monthly') {
            params.period = period;
        } else {
            params.start_date = startDate;
            params.end_date = endDate;
        }
        router.get(route('payroll.index'), params, { preserveState: true });
    };

    const stats = useMemo(() => {
        const total = payrollData.reduce((acc, curr) => acc + curr.net_salary, 0);
        const commissions = payrollData.reduce((acc, curr) => acc + curr.total_commission, 0);
        const deductions = payrollData.reduce((acc, curr) => acc + curr.total_deduction, 0);
        return { total, commissions, deductions };
    }, [payrollData]);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Penggajian Staff"
                    backHref={route('dashboard')}
                    subtitle="Manajemen Komisi & Gaji Pokok"
                    badge="HR & Payroll"
                />
            }
        >
            <Head title="Payroll" />

            <div className="max-w-7xl mx-auto space-y-10 px-4 pb-20">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-roxy-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative flex flex-col gap-4">
                            <div className="w-12 h-12 bg-roxy-primary/10 rounded-2xl flex items-center justify-center text-roxy-primary">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran Gaji</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatIDR(stats.total)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-roxy-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative flex flex-col gap-4">
                            <div className="w-12 h-12 bg-roxy-primary/10 rounded-2xl flex items-center justify-center text-roxy-primary">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Komisi Barber</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{formatIDR(stats.commissions)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative flex flex-col gap-4">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Potongan Keterlambatan</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight text-rose-600">{formatIDR(stats.deductions)}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-roxy-primary/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                            <button 
                                onClick={() => setFilterType('monthly')}
                                className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${filterType === 'monthly' ? 'bg-roxy-primary text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Bulanan
                            </button>
                            <button 
                                onClick={() => setFilterType('range')}
                                className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${filterType === 'range' ? 'bg-roxy-primary text-white' : 'text-white/40 hover:text-white'}`}
                            >
                                Custom Range
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row items-end gap-6">
                            {filterType === 'monthly' ? (
                                <div className="flex-1 w-full space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-roxy-primary">Periode Bulan</label>
                                    <input 
                                        type="month" 
                                        value={period} 
                                        onChange={(e) => setPeriod(e.target.value)}
                                        className="w-full bg-white/10 border-white/20 rounded-2xl py-4 px-6 text-white font-bold focus:ring-roxy-primary focus:border-roxy-primary"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 w-full space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-roxy-primary">Dari Tanggal</label>
                                        <input 
                                            type="date" 
                                            value={startDate} 
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-white/10 border-white/20 rounded-2xl py-4 px-6 text-white font-bold focus:ring-roxy-primary focus:border-roxy-primary"
                                        />
                                    </div>
                                    <div className="flex-1 w-full space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-roxy-primary">Sampai Tanggal</label>
                                        <input 
                                            type="date" 
                                            value={endDate} 
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-white/10 border-white/20 rounded-2xl py-4 px-6 text-white font-bold focus:ring-roxy-primary focus:border-roxy-primary"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="flex-1 w-full space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-roxy-primary">Cabang</label>
                                <select 
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                    className="w-full bg-white/10 border-white/20 rounded-2xl py-4 px-6 text-white font-bold focus:ring-roxy-primary focus:border-roxy-primary"
                                >
                                    <option value="" className="text-slate-800">Semua Cabang</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id} className="text-slate-800">{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={handleFilter}
                                className="bg-roxy-primary hover:bg-roxy-primary/90 text-white p-5 rounded-2xl shadow-xl shadow-roxy-primary/30 transition-all active:scale-95 shrink-0"
                            >
                                <Filter size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payroll List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <UserIcon size={20} className="text-roxy-primary" />
                            Daftar Penggajian Staff
                        </h3>
                        <button
                            onClick={() => {
                                const params = new URLSearchParams({
                                    start_date: startDate,
                                    end_date: endDate,
                                    branch_id: branchId
                                });
                                if (filterType === 'monthly') params.set('period', period);
                                window.open(route('payroll.export') + '?' + params.toString());
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-roxy-primary hover:shadow-xl hover:shadow-roxy-primary/30 transition-all active:scale-95"
                        >
                            <Download size={16} />
                            Generate PDF Seluruh Staff
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {payrollData.length > 0 ? (
                            payrollData.map((data, idx) => (
                                <Link 
                                    key={idx}
                                    href={route('payroll.show', { 
                                        user: data.user.id, 
                                        period: data.period,
                                        start_date: data.start_date,
                                        end_date: data.end_date
                                    })}
                                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center gap-8 hover:shadow-2xl hover:border-roxy-primary/20 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-roxy-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    {/* User Info */}
                                    <div className="flex items-center gap-6 flex-1 w-full">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[1.75rem] flex items-center justify-center text-slate-400 border-2 border-white shadow-lg shrink-0 group-hover:bg-roxy-primary/10 group-hover:text-roxy-primary transition-colors">
                                            <UserIcon size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-slate-800 text-lg leading-tight">{data.user.name}</h4>
                                                {data.status === 'paid' && <CheckCircle2 size={16} className="text-roxy-primary" />}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    {data.user.role}
                                                </span>
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    {data.user.branch?.name || 'No Branch'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Summary */}
                                    <div className="flex items-center justify-between sm:justify-end gap-10 w-full sm:w-auto border-t sm:border-t-0 pt-6 sm:pt-0 border-slate-50">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Salary</p>
                                            <p className="text-xl font-black text-slate-800">{formatIDR(data.net_salary)}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-roxy-primary group-hover:text-white group-hover:rotate-12 transition-all">
                                            <ChevronRight size={24} />
                                        </div>
                                    </div>

                                    {/* Detailed Indicators */}
                                    <div className="w-full flex items-center gap-6 mt-4 sm:absolute sm:bottom-4 sm:left-34 sm:mt-0 px-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <DollarSign size={10} className="text-roxy-primary" />
                                            Comm: {formatIDR(data.total_commission)}
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <Clock size={10} className="text-rose-500" />
                                            Late: {data.late_count}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-20 bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                                <Wallet size={48} className="mx-auto text-slate-200 mb-4" />
                                <h4 className="text-lg font-bold text-slate-600">Tidak ada data staff</h4>
                                <p className="text-slate-400 text-sm">Pilih cabang atau periode yang berbeda</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
