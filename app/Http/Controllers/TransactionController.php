<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Transaction::with(['customer', 'cashier', 'items.item'])
            ->latest();

        // Filter by branch jika bukan super admin
        if ($user->role !== 'super_admin') {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter pencarian
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('transaction_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Fix B3: Tambah dukungan date_filter yang hilang
        if ($request->filled('date_filter')) {
            $now = Carbon::now();
            switch ($request->date_filter) {
                case 'today':
                    $query->whereDate('created_at', $now->toDateString());
                    break;
                case 'this_week':
                    $query->whereBetween('created_at', [
                        $now->startOfWeek()->startOfDay(),
                        $now->endOfWeek()->endOfDay()
                    ]);
                    break;
                case 'this_month':
                    $query->whereMonth('created_at', $now->month)
                          ->whereYear('created_at', $now->year);
                    break;
                case 'custom':
                    if ($request->filled('start_date') && $request->filled('end_date')) {
                        $query->whereBetween('created_at', [
                            Carbon::parse($request->start_date)->startOfDay(),
                            Carbon::parse($request->end_date)->endOfDay()
                        ]);
                    }
                    break;
            }
        }

        $transactions = $query->paginate(15)->withQueryString();

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'date_filter', 'start_date', 'end_date']),
        ]);
    }

    public function show($id)
    {
        $transaction = Transaction::with(['customer', 'cashier', 'items.item', 'items.barber', 'branch'])
            ->findOrFail($id);
            
        return response()->json($transaction);
    }

    public function edit($id, Request $request)
    {
        $user = $request->user();

        // Hanya superadmin yang boleh edit transaksi
        if ($user->role !== 'super_admin') {
            abort(403, 'Hanya Super Admin yang dapat mengedit transaksi.');
        }

        $transaction = Transaction::with([
            'customer',
            'cashier',
            'branch',
            'items.barber',
            'items.item',
        ])->findOrFail($id);

        // Ambil semua barber aktif (superadmin bisa lihat semua cabang)
        $barbers = User::where('role', 'barber')
            ->where('is_active', true)
            ->when($transaction->branch_id, function ($q) use ($transaction) {
                $q->where('branch_id', $transaction->branch_id);
            })
            ->select('id', 'name', 'commission_rate')
            ->orderBy('name')
            ->get();

        return Inertia::render('Transactions/Edit', [
            'transaction' => $transaction,
            'barbers'     => $barbers,
        ]);
    }

    public function update($id, Request $request)
    {
        $user = $request->user();

        // Hanya superadmin yang boleh update transaksi
        if ($user->role !== 'super_admin') {
            abort(403, 'Hanya Super Admin yang dapat mengedit transaksi.');
        }

        $request->validate([
            'items'            => ['required', 'array'],
            'items.*.id'       => ['required', 'integer', 'exists:transaction_items,id'],
            'items.*.barber_id'=> ['nullable', 'integer', 'exists:users,id'],
        ]);

        $transaction = Transaction::with('items')->findOrFail($id);

        DB::transaction(function () use ($transaction, $request, $user) {
            $totalCommission = 0;

            foreach ($request->items as $itemData) {
                /** @var TransactionItem $item */
                $item = $transaction->items->firstWhere('id', $itemData['id']);

                if (!$item || $item->item_type !== 'service') {
                    // Produk tidak diedit
                    $totalCommission += (float) ($item->commission_amount ?? 0);
                    continue;
                }

                $barberId      = $itemData['barber_id'] ?? null;
                $commissionRate   = 0;
                $commissionAmount = 0;

                if ($barberId) {
                    $barber = User::find($barberId);
                    if ($barber) {
                        $commissionRate   = (float) $barber->commission_rate;
                        $commissionAmount = (float) $item->total_price * ($commissionRate / 100);
                    }
                }

                $item->update([
                    'barber_id'        => $barberId,
                    'commission_rate'  => $commissionRate,
                    'commission_amount'=> $commissionAmount,
                ]);

                $totalCommission += $commissionAmount;
            }

            // Audit trail di field notes
            $editNote = '[EDITED by superadmin (' . $user->name . ') pada ' . now()->format('d/m/Y H:i') . ']';
            $existingNotes = $transaction->notes ? $transaction->notes . ' ' : '';
            $transaction->update([
                'total_commission' => $totalCommission,
                'notes'            => $existingNotes . $editNote,
            ]);
        });

        Log::info('Transaction edited by superadmin', [
            'transaction_id' => $transaction->id,
            'editor_id'      => $user->id,
            'items'          => $request->items,
        ]);

        return redirect()->route('transactions.index')
            ->with('success', 'Transaksi berhasil diperbarui. Komisi barber telah dihitung ulang.');
    }

    public function destroy($id, Request $request)
    {
        $user = $request->user();
        
        // Authorization check: Only Super Admin, Admin, and Manager can delete
        if (!$user->hasRole(['super_admin', 'admin', 'manager'])) {
            return back()->with('error', 'Anda tidak memiliki akses untuk menghapus transaksi.');
        }

        $transaction = Transaction::findOrFail($id);
        
        // Soft delete items first (optional but good practice)
        $transaction->items()->delete();
        $transaction->delete();

        return back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
