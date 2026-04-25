<?php

namespace App\Services;

use App\Models\Shift;
use App\Models\Transaction;
use App\Models\CashOperation;

class ShiftService extends BaseService
{
    /**
     * Ambil shift aktif milik user.
     */
    public function getActiveShift(int $userId): ?Shift
    {
        return Shift::where('user_id', $userId)
            ->where('status', 'open')
            ->first();
    }

    /**
     * Hitung total penjualan tunai dalam sebuah shift.
     */
    public function calculateCashSales(Shift $shift): float
    {
        return (float) $shift->transactions()
            ->where('payment_method', 'cash')
            ->where('status', 'completed')
            ->sum('total_amount');
    }

    /**
     * Hitung total pengeluaran kas dalam sebuah shift.
     */
    public function calculateCashExpenses(Shift $shift): float
    {
        return (float) $shift->cashOperations()
            ->where('type', 'cash_out')
            ->where('status', 'completed')
            ->sum('amount');
    }

    /**
     * Hitung saldo akhir yang seharusnya ada di laci.
     * Formula: Modal Awal + Penjualan Tunai - Pengeluaran
     */
    public function calculateExpectedBalance(Shift $shift): float
    {
        $cashSales = $this->calculateCashSales($shift);
        $cashExpenses = $this->calculateCashExpenses($shift);

        return (float) $shift->opening_balance + $cashSales - $cashExpenses;
    }

    /**
     * Rekap total per metode pembayaran.
     */
    public function getPaymentMethodsSummary(Shift $shift): array
    {
        return $shift->transactions()
            ->where('status', 'completed')
            ->select('payment_method', \DB::raw('SUM(total_amount) as total'))
            ->groupBy('payment_method')
            ->get()
            ->pluck('total', 'payment_method')
            ->toArray();
    }

    /**
     * Rekap komisi per barber.
     */
    public function getBarberCommissions(Shift $shift): array
    {
        return \App\Models\TransactionItem::whereHas('transaction', function($query) use ($shift) {
                $query->where('shift_id', $shift->id)->where('status', 'completed');
            })
            ->whereNotNull('barber_id')
            ->with('barber:id,name')
            ->select('barber_id', \DB::raw('SUM(commission_amount) as total'))
            ->groupBy('barber_id')
            ->get()
            ->map(fn($item) => [
                'name' => $item->barber->name ?? 'Unknown',
                'total' => (float) $item->total
            ])
            ->toArray();
    }

    /**
     * Total layanan yang terjual.
     */
    public function getServicesTotal(Shift $shift): float
    {
        return (float) \App\Models\TransactionItem::whereHas('transaction', function($query) use ($shift) {
                $query->where('shift_id', $shift->id)->where('status', 'completed');
            })
            ->where('item_type', 'service')
            ->sum('total_price');
    }

    /**
     * Total produk yang terjual.
     */
    public function getProductsTotal(Shift $shift): float
    {
        return (float) \App\Models\TransactionItem::whereHas('transaction', function($query) use ($shift) {
                $query->where('shift_id', $shift->id)->where('status', 'completed');
            })
            ->where('item_type', 'product')
            ->sum('total_price');
    /**
     * Breakdown layanan yang terjual (Nama, Qty, Total).
     */
    public function getServicesBreakdown(Shift $shift): array
    {
        return \App\Models\TransactionItem::whereHas('transaction', function($query) use ($shift) {
                $query->where('shift_id', $shift->id)->where('status', 'completed');
            })
            ->where('item_type', 'service')
            ->select('item_name', \DB::raw('SUM(quantity) as qty'), \DB::raw('SUM(total_price) as total'))
            ->groupBy('item_name')
            ->get()
            ->toArray();
    }

    /**
     * Breakdown produk yang terjual (Nama, Qty, Total).
     */
    public function getProductsBreakdown(Shift $shift): array
    {
        return \App\Models\TransactionItem::whereHas('transaction', function($query) use ($shift) {
                $query->where('shift_id', $shift->id)->where('status', 'completed');
            })
            ->where('item_type', 'product')
            ->select('item_name', \DB::raw('SUM(quantity) as qty'), \DB::raw('SUM(total_price) as total'))
            ->groupBy('item_name')
            ->get()
            ->toArray();
    }
}
