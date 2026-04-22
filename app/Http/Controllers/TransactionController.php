<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Transaction::with(['customer', 'cashier', 'items.item'])
            ->latest();

        // Filter by branch if not super admin
        if ($user->role !== 'super_admin') {
            $query->where('branch_id', $user->branch_id);
        }

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('transaction_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $transactions = $query->paginate(15)->withQueryString();

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'filters' => $request->only(['search'])
        ]);
    }

    public function show($id)
    {
        $transaction = Transaction::with(['customer', 'cashier', 'items.item', 'items.barber'])
            ->findOrFail($id);
            
        return response()->json($transaction);
    }
}
