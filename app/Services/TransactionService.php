<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStockLog;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionService extends BaseService
{
    /**
     * Buat nomor transaksi unik.
     *
     * CATATAN AUDIT:
     * - Versi lama memakai COUNT() transaksi hari ini. Karena model memakai SoftDeletes,
     *   transaksi yang dihapus (soft delete) tidak ikut terhitung, padahal nomornya masih
     *   tersimpan di tabel & terkena unique index -> nomor yang dihasilkan bentrok
     *   (error "Duplicate entry TRX-xxxx" di semua cabang).
     * - Sekarang memakai nomor urut TERBESAR hari ini (termasuk yang soft-deleted).
     *
     * @param int $offset Tambahan urutan saat retry akibat tabrakan bersamaan.
     */
    public function generateTransactionNumber(int $offset = 0): string
    {
        $prefix = 'TRX-' . now()->format('Ymd');
        $prefixLength = strlen($prefix);

        $lastSequence = (int) Transaction::withTrashed()
            ->where('transaction_number', 'like', $prefix . '%')
            ->where('transaction_number', 'not like', $prefix . '-%') // abaikan format fallback lama
            ->selectRaw('MAX(CAST(SUBSTRING(transaction_number, ?) AS UNSIGNED)) as max_seq', [$prefixLength + 1])
            ->value('max_seq');

        $next = $lastSequence + 1 + $offset;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
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
        $maxAttempts = 5;

        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            try {
                return $this->createTransactionRecord($validated, $user, $shift, $attempt);
            } catch (UniqueConstraintViolationException $e) {
                // Dua cabang/kasir menyimpan di detik yang sama -> nomor bentrok, coba nomor berikutnya.
                if (!str_contains($e->getMessage(), 'transaction_number') || $attempt === $maxAttempts - 1) {
                    throw $e;
                }
                Log::warning('Nomor transaksi bentrok, mencoba ulang', ['attempt' => $attempt + 1]);
                usleep(random_int(50, 200) * 1000);
            }
        }

        throw new \RuntimeException('Gagal membuat nomor transaksi unik.');
    }

    private function createTransactionRecord(array $validated, User $user, Shift $shift, int $attempt): Transaction
    {
        return $this->transactional(function () use ($validated, $user, $shift, $attempt) {
            $transactionNumber = $this->generateTransactionNumber($attempt);

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
     *
     * ATURAN KOMISI:
     * Komisi SELALU dihitung dari users.commission_rate (rate komisi per barber),
     * BUKAN dari services.commission_rate.
     * Pengaturan komisi barber ada di menu Manajemen User.
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
                    // Komisi dari setting barber (users.commission_rate), bukan dari layanan
                    $commissionRate = (float) $barber->commission_rate;
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
