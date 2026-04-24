<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Service;
use App\Models\Product;
use App\Models\User;
use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class RankingController extends Controller
{
    /**
     * Display the ranking dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $branchId = $user->role !== 'super_admin' ? $user->branch_id : null;

        // 1. Loyal Customers (Top 10)
        $topCustomers = Customer::withCount(['transactions' => function($q) use ($branchId) {
                $q->where('status', 'completed');
                if ($branchId) $q->where('branch_id', $branchId);
            }])
            ->withSum(['transactions' => function($q) use ($branchId) {
                $q->where('status', 'completed');
                if ($branchId) $q->where('branch_id', $branchId);
            }], 'total_amount')
            ->orderByDesc('transactions_count')
            ->take(10)
            ->get();

        // 2. Favorite Services (Top 10)
        $topServices = TransactionItem::where('item_type', 'service')
            ->whereHas('transaction', function($q) use ($branchId) {
                $q->where('status', 'completed');
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->select('item_id', 'item_name', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(total_price) as total_revenue'))
            ->groupBy('item_id', 'item_name')
            ->orderByDesc('total_sold')
            ->take(10)
            ->get();

        // 3. Favorite Products (Top 10)
        $topProducts = TransactionItem::where('item_type', 'product')
            ->whereHas('transaction', function($q) use ($branchId) {
                $q->where('status', 'completed');
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->select('item_id', 'item_name', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(total_price) as total_revenue'))
            ->groupBy('item_id', 'item_name')
            ->orderByDesc('total_sold')
            ->take(10)
            ->get();

        // 4. Top Barbers (Top 10)
        $topBarbers = User::where('role', 'barber')
            ->where(function($q) use ($branchId) {
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->withSum(['transactionItems' => function($q) use ($branchId) {
                $q->whereHas('transaction', function($t) use ($branchId) {
                    $t->where('status', 'completed');
                    if ($branchId) $t->where('branch_id', $branchId);
                });
            }], 'commission_amount')
            ->withCount(['transactionItems' => function($q) use ($branchId) {
                $q->whereHas('transaction', function($t) use ($branchId) {
                    $t->where('status', 'completed');
                    if ($branchId) $t->where('branch_id', $branchId);
                });
            }])
            ->orderByDesc('transaction_items_sum_commission_amount')
            ->take(10)
            ->get();

        // 5. All Customers for the Tab (Paginated with search)
        $search = $request->input('search');
        
        $allCustomers = Customer::withCount(['transactions' => function($q) use ($branchId) {
                $q->where('status', 'completed');
                if ($branchId) $q->where('branch_id', $branchId);
            }])
            ->withSum(['transactions' => function($q) use ($branchId) {
                $q->where('status', 'completed');
                if ($branchId) $q->where('branch_id', $branchId);
            }], 'total_amount')
            ->where(function($q) use ($branchId) {
                if ($branchId) $q->where('branch_id', $branchId);
            })
            ->when($search, function($q, $search) {
                $q->where(function($subQ) use ($search) {
                    $subQ->where('name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('transactions_count')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Ranking/Index', [
            'rankings' => [
                'customers' => $topCustomers,
                'services' => $topServices,
                'products' => $topProducts,
                'barbers' => $topBarbers,
            ],
            'customers' => $allCustomers,
            'filters' => [
                'branch_id' => $branchId,
                'search' => $search,
            ]
        ]);
    }
}
