import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Store, CheckCircle, ArrowRight, LogOut, AlertTriangle, Printer } from 'lucide-react';
import PrinterService from '@/Services/PrinterService';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import CurrencyInput from '@/Components/CurrencyInput';
import { formatIDR } from '@/utils/currency';
import PageHeader from '@/Components/PageHeader';

export default function ShiftIndex({ current_shift, cash_sales, cash_expenses, payment_summary, barber_commissions, services_total, products_total, services_breakdown, products_breakdown }) {
    const { auth, app_settings, flash } = usePage().props;
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [isSuccessClose, setIsSuccessClose] = useState(false);
    const [closeData, setCloseData] = useState(null);

    const handlePrint = async (type = 'open', data = null) => {
        // Gunakan data manual jika ada, jika tidak pakai current_shift dari props
        const source = data || current_shift;
        
        if (!source) {
            console.error('Print Error: No source data found', { type, data, current_shift });
            return;
        }
        
        setPrinting(true);
        try {
            const isClosing = type === 'close';
            
            // Log untuk debug di console browser
            console.log(`Printing ${type} report...`, source);

            const printData = {
                storeName: app_settings.app_name,
                branchName: auth.user.branch?.name || '',
                cashierName: auth.user.name,
                time: new Date(isClosing ? (source.closed_at || new Date()) : source.opened_at).toLocaleString('id-ID'),
                openingBalance: parseFloat(source.opening_balance),
                notes: source.notes,
                // For close report - Mapping keys from snake_case (DB) to camelCase (Printer)
                cashSales: isClosing ? parseFloat(source.cash_sales || 0) : 0,
                cashExpenses: isClosing ? parseFloat(source.cash_expenses || 0) : 0,
                expectedBalance: isClosing ? parseFloat(source.expected_balance || 0) : 0,
                closingBalance: isClosing ? parseFloat(source.closing_balance || 0) : 0,
                difference: isClosing ? parseFloat(source.difference || 0) : 0,
                paymentSummary: isClosing ? (source.payment_summary || {}) : {},
                barberCommissions: isClosing ? (source.barber_commissions || []) : [],
                servicesTotal: isClosing ? parseFloat(source.services_total || 0) : 0,
                productsTotal: isClosing ? parseFloat(source.products_total || 0) : 0,
                servicesBreakdown: isClosing ? (source.services_breakdown || []) : [],
                productsBreakdown: isClosing ? (source.products_breakdown || []) : [],
            };

            await PrinterService.printShiftReport(printData, type, app_settings.receipt_logo);
        } catch (error) {
            alert('Gagal mencetak: ' + error.message);
        } finally {
            setPrinting(false);
        }
    };

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
        openForm.post(route('shifts.open'), {
            onSuccess: () => {
                setIsSuccessOpen(true);
            }
        });
    };

    const submitClose = (e) => {
        e.preventDefault();
        closeForm.post(route('shifts.close'), {
            onSuccess: (page) => {
                setCloseData(page.props.flash.just_closed_data);
                setIsSuccessClose(true);
            }
        });
    };

    const handlePriceChange = (value, formField) => {
        const numericValue = value.replace(/\D/g, '');
        if (formField === 'open') {
            openForm.setData('opening_balance', numericValue);
        } else {
            closeForm.setData('closing_balance', numericValue);
        }
    };

    const formatInputDisplay = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('id-ID').format(value);
    };

    return (
        <>
            <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Manajemen Shift"
                    backHref={route('dashboard')}
                    subtitle={current_shift ? (
                        <>Shift aktif sejak <span className="text-roxy-primary font-bold">{new Date(current_shift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></>
                    ) : 'Belum ada shift aktif hari ini.'}
                    badge={current_shift ? 'Shift Aktif' : 'Shift Tutup'}
                    badgeColor={current_shift ? 'emerald' : 'rose'}
                />
            }
        >
            <Head title="Shift Kasir" />

            <div className="max-w-4xl mx-auto space-y-8 landscape:space-y-4">
                {!current_shift ? (
                    /* Open Shift Card */
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                        <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
                            <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-teal-500/20 blur-[60px] rounded-full"></div>
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-teal-400">
                                    <Store size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black font-heading">Buka Shift Kasir</h3>
                                    <p className="text-slate-400 text-sm mt-1">Siapkan modal awal laci sebelum memulai transaksi.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submitOpen} className="p-6 sm:p-10 space-y-8">
                            <div className="space-y-4">
                                <InputLabel htmlFor="opening_balance" value="Modal Awal (Cash in Drawer)" className="text-slate-500 font-bold uppercase tracking-wider text-[10px]" />
                                <CurrencyInput
                                    id="opening_balance"
                                    value={openForm.data.opening_balance}
                                    onChange={(val) => openForm.setData('opening_balance', val)}
                                    required
                                />
                                {openForm.errors.opening_balance && <p className="text-rose-500 text-xs font-bold">{openForm.errors.opening_balance}</p>}
                            </div>

                            <div className="space-y-4">
                                <InputLabel htmlFor="notes" value="Catatan Tambahan (Opsional)" className="text-slate-500 font-bold uppercase tracking-wider text-[10px]" />
                                <textarea
                                    id="notes"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-800 focus:ring-teal-500/20 focus:border-teal-500 transition-all min-h-[100px]"
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
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Active Shift / Close Shift UI */
                    <div className="space-y-6">
                        <div className="bg-emerald-500 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-emerald-200/50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                        <CheckCircle size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black">Shift Sedang Aktif</h3>
                                        <p className="opacity-80 text-sm font-medium">Dimulai pada {new Date(current_shift.opened_at).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePrint('open')}
                                            disabled={printing}
                                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                                        >
                                            <Printer size={16} />
                                            {printing ? 'Mencetak...' : 'Buka Shift'}
                                        </button>
                                        <button
                                            onClick={() => handlePrint('close')}
                                            disabled={printing}
                                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                                        >
                                            <Printer size={16} />
                                            {printing ? 'Mencetak...' : 'Draft Tutup Shift'}
                                        </button>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Modal Awal</p>
                                        <p className="text-2xl font-black">{formatIDR(current_shift.opening_balance)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-6 sm:p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-xl font-black text-slate-800">Akhiri Shift & Tutup Kasir</h4>
                                <span className="bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">Langkah Terakhir</span>
                            </div>

                            <form onSubmit={submitClose} className="space-y-8">
                                <div className="grid md:grid-cols-2 landscape:grid-cols-2 gap-8 landscape:gap-4">
                                    <div className="space-y-4">
                                        <InputLabel value="Saldo Akhir di Laci (Fisik)" className="text-slate-500 font-bold uppercase tracking-wider text-[10px]" />
                                        <CurrencyInput
                                            value={closeForm.data.closing_balance}
                                            onChange={(val) => closeForm.setData('closing_balance', val)}
                                            className="focus:ring-rose-500/20 focus:border-rose-500"
                                            required
                                        />
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-4">Ringkasan Sistem</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Modal Awal</span>
                                                <span className="text-slate-800 font-bold">{formatIDR(current_shift.opening_balance)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Total Penjualan Tunai</span>
                                                <span className="text-slate-800 font-bold">{formatIDR(cash_sales)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium text-rose-500">Total Pengeluaran</span>
                                                <span className="text-rose-600 font-bold">-{formatIDR(cash_expenses)}</span>
                                            </div>
                                            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                                <span className="text-slate-800 font-bold">Total Seharusnya</span>
                                                <span className="text-lg font-black text-emerald-600">{formatIDR(parseFloat(current_shift.opening_balance) + cash_sales - cash_expenses)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <InputLabel value="Catatan Penutup" className="text-slate-500 font-bold uppercase tracking-wider text-[10px]" />
                                    <textarea
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-800 focus:ring-rose-500/20 focus:border-rose-500 transition-all min-h-[100px]"
                                        value={closeForm.data.notes}
                                        onChange={(e) => closeForm.setData('notes', e.target.value)}
                                        placeholder="Misal: Uang receh 500 habis..."
                                    />
                                </div>

                                {/* Confirmation Step — prevents accidental close */}
                                {!showCloseConfirm ? (
                                    <button
                                        type="button"
                                        disabled={!closeForm.data.closing_balance}
                                        onClick={() => setShowCloseConfirm(true)}
                                        className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-5 rounded-3xl text-lg font-black transition-all duration-300 shadow-xl shadow-rose-500/20 active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-3"
                                    >
                                        <LogOut size={20} />
                                        Tutup Shift & Keluar
                                    </button>
                                ) : (
                                    <div className="border-2 border-rose-300 bg-rose-50 rounded-3xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-rose-800 text-sm">Konfirmasi Tutup Shift?</p>
                                                <p className="text-xs text-rose-600 mt-1">Tindakan ini tidak dapat dibatalkan. Pastikan semua transaksi sudah selesai.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowCloseConfirm(false)}
                                                className="flex-1 bg-white border border-rose-200 text-rose-600 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-rose-50 active:scale-95"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={closeForm.processing}
                                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                {closeForm.processing ? (
                                                    <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <CheckCircle size={16} />
                                                        Ya, Tutup Sekarang
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>

        {/* Success Modal (POS Style) */}
        {(isSuccessOpen || isSuccessClose) && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
                        <div className={`w-24 h-24 ${isSuccessOpen ? 'bg-teal-500' : 'bg-rose-500'} text-white rounded-full flex items-center justify-center shadow-2xl mb-8 animate-bounce`}>
                            <CheckCircle size={48} strokeWidth={3} />
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-900 mb-2">
                            {isSuccessOpen ? 'Shift Berhasil Dibuka!' : 'Shift Berhasil Ditutup!'}
                        </h2>
                        <p className="text-slate-500 font-medium mb-12">
                            {isSuccessOpen 
                                ? 'Shift Anda telah aktif. Silakan cetak laporan pembukaan jika diperlukan.' 
                                : 'Shift telah berakhir. Silakan cetak laporan penutupan untuk arsip.'}
                        </p>

                        <div className="grid grid-cols-1 gap-4 w-full">
                            <button
                                onClick={() => handlePrint(isSuccessOpen ? 'open' : 'close', isSuccessClose ? closeData : null)}
                                disabled={printing}
                                className={`flex items-center justify-center gap-3 ${isSuccessOpen ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'} text-white py-5 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-50`}
                            >
                                {printing ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Printer size={20} />
                                )}
                                CETAK LAPORAN
                            </button>
                            
                            {isSuccessOpen ? (
                                <a
                                    href={route('pos.index')}
                                    className="flex items-center justify-center gap-3 bg-slate-900 text-white py-5 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    <ArrowRight size={20} />
                                    LANJUT KE POS
                                </a>
                            ) : (
                                <a
                                    href={route('dashboard')}
                                    className="flex items-center justify-center gap-3 bg-white text-slate-900 border-2 border-slate-100 py-5 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    <CheckCircle size={20} />
                                    SELESAI
                                </a>
                            )}
                        </div>

                        <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Printer: RP02N (Bluetooth)
                        </p>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
