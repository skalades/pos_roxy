<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStockLog;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionService extends BaseService
{
    /**
     * Buat nomor transaksi unik dengan mekanisme retry untuk menghindari duplikasi.
     */
    public function generateTransactionNumber(): string
    {
        $prefix = 'TRX-' . date('Ymd');
        $maxRetries = 5;

        for ($i = 0; $i < $maxRetries; $i++) {
            $count = Transaction::whereDate('created_at', date('Y-m-d'))->count() + 1 + $i;
            $number = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);

            if (!Transaction::where('transaction_number', $number)->exists()) {
                return $number;
            }
        }

        // Fallback: pakai timestamp untuk memastikan unik
        return $prefix . '-' . time();
    }

    /**
     * Proses transaksi POS.
     *
     * @param array $validated Data yang sudah divalidasi
     * @param User $user Kasir yang melakukan transaksi
     * @param Shift $shift Shift yang aktif
     * @return Transaction
     */
    public function processTransaction(array $validated, User $user, Shift $shift): Transaction
    {
        return $this->transactional(function () use ($validated, $user, $shift) {
            $transactionNumber = $this->generateTransactionNumber();

            $transaction = Transaction::create([
                'branch_id' => $user->branch_id,
                'shift_id' => $shift->id,
                'cashier_id' => $user->id,
                'customer_id' => $validated['customer_id'] ?? null,
                'transaction_number' => $transactionNumber,
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'],
                'discount_amount' => $validated['discount_amount'] ?? 0,
                // Log manual discount details for audit
                'payment_details' => isset($validated['manual_discount_value']) ? [
                    'manual_discount_type' => $validated['manual_discount_type'],
                    'manual_discount_value' => $validated['manual_discount_value'],
                ] : null,
                'total_amount' => $validated['total_amount'],
                'payment_method' => $validated['payment_method'],
                'payment_amount' => $validated['amount_paid'],
                'amount_paid' => $validated['amount_paid'],
                'change_amount' => $validated['change_amount'],
                'status' => 'completed',
                'notes' => $validated['notes'],
                'completed_at' => now(),
            ]);

            $totalCommission = $this->createTransactionItems($transaction, $validated['items']);
            $transaction->update(['total_commission' => $totalCommission]);

            return $transaction;
        });
    }

    /**
     * Buat item transaksi dan hitung komisi.
     * Komisi berdasarkan users.commission_rate (pengaturan user).
     */
    private function createTransactionItems(Transaction $transaction, array $items): float
    {
        $totalCommission = 0;

        foreach ($items as $item) {
            $commissionAmount = 0;
            $commissionRate = 0;

            if ($item['type'] === 'service') {
                $barber = User::find($item['barber_id']);
                if ($barber) {
                    // Komisi berdasarkan pengaturan user (users.commission_rate)
                    $commissionRate = $barber->commission_rate;
                    $commissionAmount = ($item['price'] * $item['quantity']) * ($commissionRate / 100);
                }
            }

            TransactionItem::create([
                'transaction_id' => $transaction->id,
                'item_type' => $item['type'],
                'item_id' => $item['id'],
                'item_name' => $item['name'],
                'barber_id' => $item['barber_id'] ?? null,
                'quantity' => $item['quantity'],
                'unit_price' => $item['price'],
                'subtotal' => $item['price'] * $item['quantity'],
                'total_price' => $item['price'] * $item['quantity'],
                'commission_rate' => $commissionRate,
                'commission_amount' => $commissionAmount,
            ]);

            $totalCommission += $commissionAmount;

            // Update stok untuk produk & log perubahan
            if ($item['type'] === 'product') {
                $product = Product::find($item['id']);
                if ($product) {
                    $oldStock = $product->stock_quantity;
                    $newStock = $oldStock - $item['quantity'];

                    $product->decrement('stock_quantity', $item['quantity']);

                    ProductStockLog::create([
                        'product_id' => $product->id,
                        'user_id' => $transaction->cashier_id,
                        'type' => 'out',
                        'quantity' => -$item['quantity'],
                        'old_stock' => $oldStock,
                        'new_stock' => $newStock,
                        'reason' => 'Penjualan POS: ' . $transaction->transaction_number,
                    ]);
                }
            }
        }

        return $totalCommission;
    }
}
