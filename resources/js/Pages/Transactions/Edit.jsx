import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import {
    Scissors, Package, ChevronLeft, Save, AlertTriangle,
    User, CheckCircle2, Info, Loader2, RefreshCw
} from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import { formatIDR } from '@/utils/currency';

function StatusBadge({ status }) {
    const map = {
        completed: 'bg-teal-100 text-teal-700',
        cancelled: 'bg-rose-100 text-rose-700',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
            {status}
        </span>
    );
}

function ServiceItemRow({ item, barbers, selectedBarberId, onBarberChange }) {
    const selectedBarber = barbers.find(b => b.id === selectedBarberId) ?? null;
    const commission = selectedBarber
        ? (parseFloat(item.total_price) * (parseFloat(selectedBarber.commission_rate) / 100))
        : 0;

    return (
        <div className="p-5 rounded-[1.5rem] border-2 border-teal-100 bg-teal-50/40 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                    <Scissors size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{item.item_name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                        {item.quantity} x {formatIDR(item.unit_price)} = {formatIDR(item.total_price)}
                    </p>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={12} /> Pilih Barber
                    {!selectedBarberId && (
                        <span className="ml-1 text-amber-500 flex items-center gap-1">
                            <AlertTriangle size={10} /> Belum dipilih
                        </span>
                    )}
                </label>
                <select
                    value={selectedBarberId ?? ''}
                    onChange={(e) => onBarberChange(item.id, e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                >
                    <option value="">— Tidak ada barber —</option>
                    {barbers.map(b => (
                        <option key={b.id} value={b.id}>
                            {b.name} (Komisi {b.commission_rate}%)
                        </option>
                    ))}
                </select>
            </div>

            {selectedBarber && (
                <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-teal-200">
                    <div className="flex items-center gap-2 text-teal-700">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-bold">Komisi untuk {selectedBarber.name}</span>
                    </div>
                    <span className="text-sm font-black text-teal-700">
                        {selectedBarber.commission_rate}% = {formatIDR(commission)}
                    </span>
                </div>
            )}
        </div>
    );
}

function ProductItemRow({ item }) {
    return (
        <div className="p-5 rounded-[1.5rem] border-2 border-slate-100 bg-slate-50/40 space-y-1 opacity-70">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-700 truncate">{item.item_name}</p>
                    <p className="text-xs text-slate-400 font-medium">
                        {item.quantity} x {formatIDR(item.unit_price)} = {formatIDR(item.total_price)}
                    </p>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">Produk</span>
            </div>
        </div>
    );
}

export default function TransactionEdit({ transaction, barbers }) {
    const [barberMap, setBarberMap] = useState(() => {
        const init = {};
        transaction.items.forEach(item => {
            if (item.item_type === 'service') {
                init[item.id] = item.barber_id ?? null;
            }
        });
        return init;
    });

    const [submitting, setSubmitting] = useState(false);

    const totalCommissionPreview = useMemo(() => {
        let total = 0;
        transaction.items.forEach(item => {
            if (item.item_type !== 'service') return;
            const barberId = barberMap[item.id];
            if (!barberId) return;
            const barber = barbers.find(b => b.id === barberId);
            if (!barber) return;
            total += parseFloat(item.total_price) * (parseFloat(barber.commission_rate) / 100);
        });
        return total;
    }, [barberMap, barbers, transaction.items]);

    const originalCommission = parseFloat(transaction.total_commission ?? 0);
    const commissionDiff = totalCommissionPreview - originalCommission;

    const handleBarberChange = (itemId, barberId) => {
        setBarberMap(prev => ({ ...prev, [itemId]: barberId }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!confirm('Simpan perubahan barber dan hitung ulang komisi?')) return;
        setSubmitting(true);

        const items = transaction.items.map(item => ({
            id: item.id,
            barber_id: item.item_type === 'service' ? (barberMap[item.id] ?? null) : null,
        }));

        router.put(route('transactions.update', transaction.id), { items }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const serviceItems = transaction.items.filter(i => i.item_type === 'service');
    const productItems = transaction.items.filter(i => i.item_type === 'product');
    const hasUnassignedService = serviceItems.some(i => !barberMap[i.id]);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Edit Transaksi"
                    backHref={route('transactions.index')}
                    subtitle={transaction.transaction_number}
                    badge="Superadmin"
                    badgeColor="purple"
                />
            }
        >
            <Head title={`Edit Transaksi - ${transaction.transaction_number}`} />

            <form onSubmit={handleSubmit}>
                <div className="max-w-3xl mx-auto space-y-6 pb-32 px-4 sm:px-0">

                    {/* Info Transaksi (read-only) */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    {transaction.transaction_number}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    {new Date(transaction.created_at).toLocaleString('id-ID', {
                                        day: '2-digit', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <StatusBadge status={transaction.status} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                            {[
                                { label: 'Pelanggan', value: transaction.customer?.name || 'Walk-in' },
                                { label: 'Kasir', value: transaction.cashier?.name || '—' },
                                { label: 'Cabang', value: transaction.branch?.name || '—' },
                                { label: 'Metode Bayar', value: transaction.payment_method?.toUpperCase() || '—' },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                                    <p className="text-sm font-black text-slate-800">{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-dashed border-slate-200">
                            <span className="text-sm font-bold text-slate-500">Total Transaksi</span>
                            <span className="text-xl font-black text-roxy-primary">{formatIDR(transaction.total_amount)}</span>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                        <Info size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs font-bold text-amber-700 leading-relaxed">
                            Hanya barber per item <strong>layanan</strong> yang dapat diubah. Data harga dan total transaksi tidak terpengaruh.
                            Komisi akan dihitung ulang otomatis berdasarkan commission_rate barber.
                        </p>
                    </div>

                    {/* Item Layanan */}
                    {serviceItems.length > 0 && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Item Layanan ({serviceItems.length})
                                </h3>
                                {hasUnassignedService && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 bg-amber-50 px-3 py-1.5 rounded-full">
                                        <AlertTriangle size={10} />
                                        Ada item tanpa barber
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {serviceItems.map(item => (
                                    <ServiceItemRow
                                        key={item.id}
                                        item={item}
                                        barbers={barbers}
                                        selectedBarberId={barberMap[item.id]}
                                        onBarberChange={handleBarberChange}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Item Produk (read-only) */}
                    {productItems.length > 0 && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Item Produk ({productItems.length}) — Tidak dapat diubah
                            </h3>
                            <div className="space-y-3">
                                {productItems.map(item => (
                                    <ProductItemRow key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ringkasan Komisi */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Ringkasan Komisi
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold">Komisi Sebelumnya</span>
                                <span className="font-black text-slate-700">{formatIDR(originalCommission)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold flex items-center gap-2">
                                    <RefreshCw size={13} />
                                    Komisi Baru (Preview)
                                </span>
                                <span className="font-black text-teal-700">{formatIDR(totalCommissionPreview)}</span>
                            </div>
                            {commissionDiff !== 0 && (
                                <div className={`flex justify-between items-center text-sm pt-3 border-t-2 border-dashed ${commissionDiff > 0 ? 'border-teal-200' : 'border-rose-200'}`}>
                                    <span className={`font-black ${commissionDiff > 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                                        {commissionDiff > 0 ? 'Naik' : 'Turun'}
                                    </span>
                                    <span className={`font-black text-lg ${commissionDiff > 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                                        {commissionDiff > 0 ? '+' : ''}{formatIDR(commissionDiff)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.visit(route('transactions.index'))}
                            className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <ChevronLeft size={16} />
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-roxy-primary text-white hover:bg-roxy-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-roxy-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                                : <><Save size={16} /> Simpan dan Hitung Ulang Komisi</>
                            }
                        </button>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
