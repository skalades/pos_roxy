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
}
