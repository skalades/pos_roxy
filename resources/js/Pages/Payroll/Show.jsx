import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import React from 'react';
import { 
    ArrowLeft, 
    Download, 
    Printer, 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    DollarSign,
    User as UserIcon,
    Calendar,
    Briefcase,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { formatIDR } from '@/utils/currency';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import PageHeader from '@/Components/PageHeader';

export default function Show({ payroll, commissions, lates, filters }) {
    const { post, processing } = useForm({
        user_id: payroll.user.id,
        period: filters.period
    });

    const handleProcess = () => {
        if (confirm('Apakah Anda yakin ingin memproses payroll ini? Status akan ditandai sebagai "Paid".')) {
            post(route('payroll.generate'));
        }
    };

    const periodLabel = filters.period && !filters.start_date ? (
        format(new Date(filters.period), 'MMMM yyyy', { locale: id })
    ) : (
        `${format(new Date(filters.start_date), 'dd MMM')} - ${format(new Date(filters.end_date), 'dd MMM yyyy')}`
    );

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Detail Gaji"
                    subtitle={periodLabel}
                    badge={payroll.status === 'paid' ? 'Terbayar' : 'Pending'}
                    badgeColor={payroll.status === 'paid' ? 'emerald' : 'amber'}
                    backHref={route('payroll.index', { 
                        period: filters.period, 
                        start_date: filters.start_date, 
                        end_date: filters.end_date,
                        branch_id: payroll.user.branch_id 
                    })}
                    action={
                        <div className="flex items-center gap-3">
                            <button className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-roxy-primary hover:border-roxy-primary transition-all active:scale-95 shadow-sm">
                                <Printer size={20} />
                            </button>
                            {payroll.status !== 'paid' && (
                                <button 
                                    onClick={handleProcess}
                                    disabled={processing}
                                    className="bg-roxy-primary hover:bg-teal-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-roxy-primary/30 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <CheckCircle2 size={16} />
                                    Proses Pembayaran
                                </button>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={`Gaji ${payroll.user.name}`} />

            <div className="max-w-5xl mx-auto space-y-10 px-4 pb-20">
                {/* Employee Card */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-roxy-primary/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="relative flex flex-col md:flex-row items-center gap-10">
                        <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 border-4 border-white shadow-xl">
                            <UserIcon size={64} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-3xl font-black text-slate-800 mb-3">{payroll.user.name}</h3>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    <Briefcase size={14} className="text-roxy-primary" />
                                    {payroll.user.role}
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    <ShieldCheck size={14} className="text-roxy-primary" />
                                    {payroll.user.branch?.name || 'Pusat'}
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    <Calendar size={14} className="text-roxy-primary" />
                                    Masuk: {payroll.user.profile?.hire_date ? format(new Date(payroll.user.profile.hire_date), 'dd MMM yyyy') : '-'}
                                </div>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Take Home Pay</p>
                            <h4 className="text-4xl font-black text-roxy-primary tracking-tighter">{formatIDR(payroll.net_salary)}</h4>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Earnings */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-4">Penghasilan (Earnings)</h4>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-roxy-primary/10 text-roxy-primary rounded-xl flex items-center justify-center">
                                            <DollarSign size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">Gaji Pokok</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Bulanan tetap</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-slate-800">{formatIDR(payroll.base_salary)}</p>
                                </div>

                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-roxy-primary/10 text-roxy-primary rounded-xl flex items-center justify-center">
                                            <TrendingUp size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">Total Komisi</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{commissions.length} Transaksi</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-roxy-primary">+{formatIDR(payroll.total_commission)}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 flex justify-between items-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Earnings</p>
                                <p className="font-black text-slate-800">{formatIDR(payroll.base_salary + payroll.total_commission)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-4">Potongan (Deductions)</h4>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">Denda Terlambat</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{payroll.late_count} Kali Terlambat</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-rose-600">-{formatIDR(payroll.total_deduction)}</p>
                                </div>

                                <div className="flex items-center justify-between group opacity-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">BPJS / Pajak</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Belum diaktifkan</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-slate-800">Rp 0</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 flex justify-between items-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal Deductions</p>
                                <p className="font-black text-rose-600">-{formatIDR(payroll.total_deduction)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Tabs / Lists */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="border-b border-slate-50 p-8 flex items-center justify-between">
                        <h4 className="font-black text-slate-800 flex items-center gap-3">
                            <AlertCircle size={20} className="text-roxy-primary" />
                            Riwayat Keterlambatan
                        </h4>
                        <span className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            {lates.length} Kejadian
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jam Masuk</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lates.map((late, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-5 font-bold text-slate-700">{format(new Date(late.date), 'dd MMMM yyyy', { locale: id })}</td>
                                        <td className="px-8 py-5 font-black text-slate-800">{late.clock_in_at ? format(new Date(late.clock_in_at), 'HH:mm') : '-'}</td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                Terlambat
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {lates.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-10 text-center text-slate-400 font-medium">Tidak ada catatan keterlambatan bulan ini. Hebat! 🚀</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
