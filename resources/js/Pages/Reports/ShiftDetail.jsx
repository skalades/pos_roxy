import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import { Store, CheckCircle, Clock, Calendar, ArrowLeft, Edit2, X, Trash2, AlertTriangle } from 'lucide-react';
import { formatIDR } from '@/utils/currency';

export default function ShiftDetail({ 
    shift, cash_sales, cash_expenses, expected_balance, 
    payment_summary, barber_commissions, services_total, products_total, 
    services_breakdown, products_breakdown, total_discount, discount_breakdown 
}) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth.user.role === 'super_admin';
    const [showCorrectionModal, setShowCorrectionModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');
    
    const { data, setData, put, processing: correctionProcessing, errors: correctionErrors, reset: correctionReset } = useForm({
        closing_balance: shift.closing_balance || '',
        notes: ''
    });

    const submitCorrection = (e) => {
        e.preventDefault();
        put(route('reports.shifts.correct', shift.id), {
            onSuccess: () => {
                setShowCorrectionModal(false);
                correctionReset('notes');
            }
        });
    };

    const handleDeleteShift = () => {
        if (deleteConfirmationWord === 'HAPUS') {
            router.delete(route('reports.shifts.destroy', shift.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader 
                    title="Detail Laporan Shift"
                    subtitle={`Cabang: ${shift.branch?.name || '-'} • Kasir: ${shift.user?.name || '-'}`}
                    backHref={route('reports.shifts')}
                />
            }
        >
            <Head title="Detail Laporan Shift" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Status */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                    <div className={`p-8 ${shift.status === 'open' ? 'bg-emerald-500' : 'bg-slate-900'} text-white relative overflow-hidden`}>
                        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-white/10 blur-[60px] rounded-full"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/10 flex items-center justify-center">
                                    {shift.status === 'open' ? <Clock size={32} /> : <CheckCircle size={32} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black">
                                        {shift.status === 'open' ? 'Shift Sedang Aktif' : 'Shift Telah Ditutup'}
                                    </h3>
                                    <p className="opacity-80 text-sm mt-1">
                                        Mulai: {new Date(shift.opened_at).toLocaleString('id-ID')}
                                        {shift.closed_at && ` • Selesai: ${new Date(shift.closed_at).toLocaleString('id-ID')}`}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Status</p>
                                <span className="bg-white/20 px-4 py-2 rounded-xl text-sm font-black inline-block uppercase tracking-wider">
                                    {shift.status}
                                </span>
                                {isSuperAdmin && shift.status === 'closed' && (
                                    <button 
                                        onClick={() => setShowCorrectionModal(true)}
                                        className="mt-2 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                                    >
                                        <Edit2 size={14} />
                                        Koreksi Laporan
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Rekap Saldo */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative">
                        {isSuperAdmin && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="absolute top-6 right-6 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-xl transition-colors"
                                title="Hapus Permanen Shift Training"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                            <h4 className="font-black text-slate-800 uppercase tracking-widest pr-8">Ringkasan Sistem & Laci</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                <span className="text-slate-500 font-bold text-sm">Modal Awal</span>
                                <span className="text-slate-800 font-black">{formatIDR(shift.opening_balance)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                <span className="text-slate-500 font-bold text-sm">Total Penjualan Tunai</span>
                                <span className="text-slate-800 font-black">{formatIDR(cash_sales)}</span>
                            </div>
                            
                            {Object.entries(payment_summary)
                                .filter(([method]) => method !== 'cash')
                                .map(([method, total]) => (
                                    <div key={method} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                        <span className="text-slate-500 font-bold text-sm uppercase flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                            {method.replace('_', ' ')}
                                        </span>
                                        <span className="text-slate-800 font-black">{formatIDR(total)}</span>
                                    </div>
                                ))}

                            {total_discount > 0 && (
                                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl border border-orange-100/50">
                                    <span className="text-orange-600 font-bold text-sm">Total Diskon Diberikan</span>
                                    <span className="text-orange-700 font-black">{formatIDR(total_discount)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl">
                                <span className="text-rose-600 font-bold text-sm">Total Pengeluaran</span>
                                <span className="text-rose-700 font-black">-{formatIDR(cash_expenses)}</span>
                            </div>

                            <div className="pt-4 mt-2 border-t border-slate-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold text-sm">Total Seharusnya (Sistem)</span>
                                    <span className="text-slate-800 font-black text-lg">{formatIDR(expected_balance)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold text-sm">Fisik di Laci (Kasir)</span>
                                    <span className="text-slate-800 font-black text-lg">
                                        {shift.closing_balance !== null ? formatIDR(shift.closing_balance) : 'Belum Ditutup'}
                                    </span>
                                </div>
                                {shift.status === 'closed' && (
                                    <div className={`flex justify-between items-center p-4 rounded-2xl ${
                                        parseFloat(shift.difference) < 0 ? 'bg-rose-100 text-rose-700' : 
                                        parseFloat(shift.difference) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                        <span className="font-black text-sm uppercase">Selisih</span>
                                        <span className="font-black text-xl">
                                            {parseFloat(shift.difference) > 0 ? '+' : ''}{formatIDR(shift.difference)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rincian Tambahan */}
                    <div className="space-y-6">
                        
                        {/* Breakdown Layanan & Produk */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                <h4 className="font-black text-slate-800 uppercase tracking-widest">Rincian Item Terjual</h4>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Layanan</h5>
                                    {services_breakdown.length === 0 ? (
                                        <p className="text-sm text-slate-400">Belum ada layanan terjual.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {services_breakdown.map((s, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-slate-600 font-medium">{s.item_name} <span className="text-slate-400">x{s.qty}</span></span>
                                                    <span className="text-slate-800 font-bold">{formatIDR(s.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Produk</h5>
                                    {products_breakdown.length === 0 ? (
                                        <p className="text-sm text-slate-400">Belum ada produk terjual.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {products_breakdown.map((p, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-slate-600 font-medium">{p.item_name} <span className="text-slate-400">x{p.qty}</span></span>
                                                    <span className="text-slate-800 font-bold">{formatIDR(p.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Rincian Diskon */}
                        {discount_breakdown.length > 0 && (
                            <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                                    <h4 className="font-black text-orange-800 uppercase tracking-widest">Rincian Diskon</h4>
                                </div>
                                <div className="space-y-3">
                                    {discount_breakdown.map((d, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-slate-800 font-bold text-sm">{d.trx_number}</span>
                                                <span className="text-orange-600 font-black text-sm">{formatIDR(d.discount_amount)}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">
                                                Layanan/Produk: {d.items || '-'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Komisi Barber */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                                <h4 className="font-black text-slate-800 uppercase tracking-widest">Komisi Barber</h4>
                            </div>
                            {barber_commissions.length === 0 ? (
                                <p className="text-sm text-slate-400">Belum ada komisi barber.</p>
                            ) : (
                                <div className="space-y-3">
                                    {barber_commissions.map((b, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                            <span className="text-slate-700 font-bold text-sm">{b.name}</span>
                                            <span className="text-slate-800 font-black text-sm">{formatIDR(b.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Catatan Shift */}
                        {shift.notes && (
                            <div className="bg-yellow-50 p-6 rounded-[2rem] border border-yellow-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
                                    <h4 className="font-black text-yellow-800 uppercase tracking-widest">Catatan Shift</h4>
                                </div>
                                <p className="text-sm text-yellow-800 font-medium whitespace-pre-wrap">
                                    {shift.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Koreksi Shift */}
            {showCorrectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-slate-800 text-lg">Koreksi Laporan Shift</h3>
                            <button onClick={() => setShowCorrectionModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitCorrection} className="p-6 space-y-5">
                            <div className="bg-blue-50 p-4 rounded-2xl text-sm text-blue-800 border border-blue-100">
                                <p className="font-bold mb-1">Total Sistem: {formatIDR(expected_balance)}</p>
                                <p className="opacity-80">Gunakan form ini untuk mengoreksi jumlah fisik aktual yang benar jika terjadi kesalahan input oleh kasir.</p>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fisik Aktual Laci (Benar)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-500 font-bold">Rp</span>
                                    </div>
                                    <input 
                                        type="text"
                                        required
                                        value={data.closing_balance ? parseInt(data.closing_balance).toLocaleString('id-ID') : ''}
                                        onChange={e => {
                                            const rawValue = e.target.value.replace(/\D/g, '');
                                            setData('closing_balance', rawValue);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl pl-12 pr-4 py-3 focus:ring-roxy-primary/20 focus:border-roxy-primary transition-all"
                                    />
                                </div>
                                {correctionErrors.closing_balance && <p className="mt-1 text-xs text-rose-500">{correctionErrors.closing_balance}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Catatan Koreksi Tambahan</label>
                                <textarea 
                                    rows="3"
                                    placeholder="Opsional: Tuliskan alasan koreksi (misal: Kasir salah hitung 50rb...)"
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:ring-roxy-primary/20 focus:border-roxy-primary transition-all"
                                ></textarea>
                                {correctionErrors.notes && <p className="mt-1 text-xs text-rose-500">{correctionErrors.notes}</p>}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowCorrectionModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={correctionProcessing}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex justify-center items-center gap-2"
                                >
                                    {correctionProcessing ? 'Menyimpan...' : 'Simpan Koreksi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Hapus Shift Training */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-2 border-rose-500/20">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                            <h3 className="font-black text-rose-700 text-lg flex items-center gap-2">
                                <AlertTriangle size={20} />
                                Hapus Data Training
                            </h3>
                            <button onClick={() => setShowDeleteModal(false)} className="text-rose-400 hover:text-rose-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-rose-50 p-4 rounded-2xl text-sm text-rose-800 border border-rose-100">
                                <p className="font-bold mb-1">PERINGATAN BERBAHAYA!</p>
                                <p className="opacity-90">Tindakan ini akan <b>MENGHAPUS PERMANEN</b> data shift ini beserta <b>seluruh nota transaksi, rincian layanan/produk, dan data pengeluaran (cash operation)</b> yang terjadi di dalam shift ini.</p>
                                <p className="mt-2 opacity-90">Tindakan ini tidak dapat dibatalkan. Gunakan ini HANYA untuk menghapus transaksi training/dummy sebelum Grand Opening.</p>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ketik "HAPUS" untuk melanjutkan</label>
                                <input 
                                    type="text"
                                    value={deleteConfirmationWord}
                                    onChange={e => setDeleteConfirmationWord(e.target.value)}
                                    placeholder="Ketik HAPUS disini..."
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-center"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleDeleteShift}
                                    disabled={deleteConfirmationWord !== 'HAPUS'}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={18} />
                                    Hapus Permanen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
