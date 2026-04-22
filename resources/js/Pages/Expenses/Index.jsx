import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import * as Icons from 'lucide-react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { formatIDR } from '@/utils/currency';

export default function ExpenseIndex({ expenses, active_shift }) {
    const { flash } = usePage().props;
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        reason: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('expenses.store'), {
            onSuccess: () => {
                setShowAddModal(false);
                reset();
            },
        });
    };

    const confirmDelete = (expense) => {
        setSelectedExpense(expense);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        router.delete(route('expenses.destroy', selectedExpense.id), {
            onSuccess: () => setShowDeleteModal(false),
        });
    };

    const handleAmountChange = (value) => {
        const numericValue = value.replace(/\D/g, '');
        setData('amount', numericValue);
    };

    const formatInputDisplay = (value) => {
        if (!value) return '';
        return new Intl.NumberFormat('id-ID').format(value);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-roxy-primary rounded-full shadow-[0_0_15px_rgba(13,148,136,0.5)]"></div>
                        <h2 className="text-2xl sm:text-3xl font-black font-heading leading-tight text-roxy-accent tracking-tight">
                            Pengeluaran Kasir
                        </h2>
                        <p className="text-sm text-roxy-text-muted mt-1 font-medium">
                            Total hari ini: <span className="text-rose-500 font-bold">{formatIDR(expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0))}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-roxy-primary hover:bg-roxy-primary-dark text-white px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-lg shadow-roxy-primary/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        <Icons.Plus size={18} strokeWidth={3} />
                        Tambah Pengeluaran
                    </button>
                </div>
            }
        >
            <Head title="Pengeluaran Operasional" />

            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                {/* Active Shift Warning if not open */}
                {!active_shift && (
                    <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] flex items-center gap-5 animate-pulse">
                        <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                            <Icons.AlertTriangle size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-rose-900 text-base">Shift Belum Dibuka</h4>
                            <p className="text-rose-600 text-sm font-medium">Anda harus membuka shift di menu Manajemen Shift sebelum mencatat pengeluaran.</p>
                        </div>
                    </div>
                )}

                {/* Expenses List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Daftar Pengeluaran Hari Ini</h3>
                        <Icons.ReceiptText className="text-slate-300" size={24} />
                    </div>

                    <div className="divide-y divide-slate-50">
                        {expenses.length > 0 ? (
                            expenses.map((expense) => (
                                <div key={expense.id} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-start gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                                            <Icons.ArrowUpRight size={28} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 leading-tight">{expense.reason}</h4>
                                            <p className="text-sm text-slate-500 font-medium mt-1">{expense.notes || 'Tanpa catatan tambahan'}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Icons.Clock size={12} />
                                                    {new Date(expense.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Icons.User size={12} />
                                                    {expense.user?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Nominal</p>
                                            <p className="text-xl font-black text-rose-500">{formatIDR(expense.amount)}</p>
                                        </div>
                                        
                                        {/* Action Button - Only delete if shift is open */}
                                        {expense.shift?.status === 'open' && (
                                            <button 
                                                onClick={() => confirmDelete(expense)}
                                                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                                            >
                                                <Icons.Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300">
                                    <Icons.Inbox size={40} />
                                </div>
                                <div>
                                    <h5 className="text-lg font-black text-slate-800">Belum ada pengeluaran</h5>
                                    <p className="text-sm text-slate-500">Semua operasional hari ini akan muncul di sini.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="lg">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Catat Pengeluaran</h3>
                            <p className="text-sm text-slate-500 font-medium">Input operasional kas hari ini</p>
                        </div>
                        <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400">
                            <Icons.X size={24} />
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <InputLabel htmlFor="amount" value="Nominal Pengeluaran" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500" />
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-roxy-primary transition-colors text-lg">Rp</span>
                                <TextInput
                                    id="amount"
                                    type="text"
                                    className="block w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-black focus:ring-roxy-primary/10 focus:border-roxy-primary"
                                    value={formatInputDisplay(data.amount)}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    required
                                    isFocused
                                    placeholder="0"
                                />
                            </div>
                            <InputError message={errors.amount} className="mt-2 ml-1" />
                        </div>

                        <div className="space-y-2">
                            <InputLabel htmlFor="reason" value="Keperluan / Alasan" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500" />
                            <TextInput
                                id="reason"
                                type="text"
                                className="block w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold"
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                required
                                placeholder="Contoh: Beli Air Mineral, Listrik, dll"
                            />
                            <InputError message={errors.reason} className="mt-2 ml-1" />
                        </div>

                        <div className="space-y-2">
                            <InputLabel htmlFor="notes" value="Catatan Tambahan (Opsional)" className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500" />
                            <textarea
                                id="notes"
                                className="block w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:ring-roxy-primary/10 focus:border-roxy-primary min-h-[100px]"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Detail tambahan jika diperlukan..."
                            />
                            <InputError message={errors.notes} className="mt-2 ml-1" />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={processing || !active_shift}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-3xl text-lg font-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
                            >
                                {processing ? (
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Simpan Pengeluaran
                                        <Icons.ChevronRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm">
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                        <Icons.Trash2 size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Hapus Catatan?</h3>
                        <p className="text-sm text-slate-500 mt-2">Catatan pengeluaran ini akan dihapus permanen dari audit shift.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm active:scale-95"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="flex-1 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-500/20 active:scale-95"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
