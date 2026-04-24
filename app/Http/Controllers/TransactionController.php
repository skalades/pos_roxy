<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
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
            }
        }

        $transactions = $query->paginate(15)->withQueryString();

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'date_filter']),
        ]);
    }

    public function show($id)
    {
        $transaction = Transaction::with(['customer', 'cashier', 'items.item', 'items.barber'])
            ->findOrFail($id);
            
        return response()->json($transaction);
    }
}
