import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import * as Icons from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ShiftIndex({ current_shift, cash_sales }) {
    const { auth } = usePage().props;
    
    // Form for opening shift
    const openForm = useForm({
        opening_balance: '',
        notes: '',
    });

    // Form for closing shift
    const closeForm = useForm({
        closing_balance: '',
        notes: '',
    });

    const submitOpen = (e) => {
        e.preventDefault();
        openForm.post(route('shifts.open'));
    };

    const submitClose = (e) => {
        e.preventDefault();
        closeForm.post(route('shifts.close'));
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handlePriceChange = (value, formField) => {
        // Remove everything except numbers
        const numericValue = value.replace(/\D/g, '');
        if (formField === 'open') {
            openForm.setData('opening_balance', numericValue);
        } else {
            closeForm.setData('closing_balance', numericValue);
        }
    };

    // Helper for input display
    const formatInputDisplay = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('id-ID').format(value);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-2xl font-black text-roxy-accent tracking-tight">Manajemen Shift</h2>}
        >
            <Head title="Shift Kasir" />

            <div className="max-w-4xl mx-auto space-y-8">
                {!current_shift ? (
                    /* Open Shift Card */
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                        <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
                            <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-teal-500/20 blur-[60px] rounded-full"></div>
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-teal-400">
                                    <Icons.Store size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black font-heading">Buka Shift Kasir</h3>
                                    <p className="text-slate-400 text-sm mt-1">Siapkan modal awal laci sebelum memulai transaksi.</p>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={submitOpen} className="p-10 space-y-8">
                            <div className="space-y-4">
                                <InputLabel htmlFor="opening_balance" value="Modal Awal (Cash in Drawer)" className="text-slate-500 font-bold uppercase tracking-wider text-[10px]" />
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</div>
                                    <TextInput
                                        id="opening_balance"
                                        type="text"
                                        className="w-full pl-16 pr-6 py-5 bg-slate-50 border-slate-200 rounded-3xl text-xl font-black text-slate-800 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                        value={formatInputDisplay(openForm.data.opening_balance)}
                                        onChange={(e) => handlePriceChange(e.target.value, 'open')}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                {openForm.errors.opening_balance && <p className="text-rose-500 text-xs font-bold">{openForm.errors.opening_balance}</p>}
                            </div>

                            <div className="space-y-4">
                                <InputLabel htmlFor="notes" value="Catatan Tambahan (Opsional)" className="text-slate-500 font-bold uppercase tracking-wider text-[10px]" />
                                <textarea
                                    id="notes"
                                    className="w-full px-6 py-4 bg-slate-50 border-slate-200 rounded-3xl text-sm font-medium text-slate-800 focus:ring-teal-500/20 focus:border-teal-500 transition-all min-h-[120px]"
                                    value={openForm.data.notes}
                                    onChange={(e) => openForm.setData('notes', e.target.value)}
                                    placeholder="Contoh: Pecahan 2rb ada 10 lembar..."
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={openForm.processing}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-3xl text-lg font-black transition-all duration-300 shadow-xl shadow-slate-900/20 active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                                {openForm.processing ? (
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Mulai Shift Sekarang
                                        <Icons.ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Active Shift / Close Shift UI */
                    <div className="space-y-6">
                        <div className="bg-emerald-500 text-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-200/50 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <Icons.CheckCircle size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black">Shift Sedang Aktif</h3>
                                    <p className="opacity-80 text-sm font-medium">Dimulai pada {new Date(current_shift.opened_at).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Modal Awal</p>
                                <p className="text-2xl font-black">{formatCurrency(current_shift.opening_balance)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-10">
                            <div className="flex items-center justify-between mb-10">
                                <h4 className="text-xl font-black text-slate-800">Akhiri Shift & Tutup Kasir</h4>
                                <span className="bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">Langkah Terakhir</span>
                            </div>

                            <form onSubmit={submitClose} className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <InputLabel value="Saldo Akhir di Laci (Fisik)" className="text-slate-500 font-bold uppercase tracking-wider text-[10px]" />
                                        <div className="relative">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</div>
                                            <TextInput
                                                type="text"
                                                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-slate-200 rounded-3xl text-xl font-black text-slate-800 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                                value={formatInputDisplay(closeForm.data.closing_balance)}
                                                onChange={(e) => handlePriceChange(e.target.value, 'close')}
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-4">Ringkasan Sistem</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Modal Awal</span>
                                                <span className="text-slate-800 font-bold">{formatCurrency(current_shift.opening_balance)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Total Penjualan Tunai</span>
                                                <span className="text-slate-800 font-bold">{formatCurrency(cash_sales)}</span>
                                            </div>
                                            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                                <span className="text-slate-800 font-bold">Total Seharusnya</span>
                                                <span className="text-lg font-black text-emerald-600">{formatCurrency(parseFloat(current_shift.opening_balance) + cash_sales)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <InputLabel value="Catatan Penutup" className="text-slate-500 font-bold uppercase tracking-wider text-[10px]" />
                                    <textarea
                                        className="w-full px-6 py-4 bg-slate-50 border-slate-200 rounded-3xl text-sm font-medium text-slate-800 focus:ring-rose-500/20 focus:border-rose-500 transition-all min-h-[100px]"
                                        value={closeForm.data.notes}
                                        onChange={(e) => closeForm.setData('notes', e.target.value)}
                                        placeholder="Misal: Uang receh 500 habis..."
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={closeForm.processing}
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-3xl text-lg font-black transition-all duration-300 shadow-xl shadow-rose-500/20 active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-3"
                                >
                                    {closeForm.processing ? (
                                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Tutup Shift & Keluar
                                            <Icons.LogOut size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
