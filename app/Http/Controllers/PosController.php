<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Service;
use App\Models\Shift;
use App\Models\User;
use App\Http\Requests\StoreTransactionRequest;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosController extends Controller
{
    protected TransactionService $transactionService;

    public function __construct(TransactionService $transactionService)
    {
        $this->transactionService = $transactionService;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Pastikan shift sudah dibuka
        $shift = Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return redirect()->route('dashboard')->with('error', 'Anda harus membuka shift terlebih dahulu.');
        }

        $branchId = $user->branch_id;

        // Fix B4: Gunakan closure grouping agar orWhereNull tidak bocor
        $services = Service::where(function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                      ->orWhereNull('branch_id');
            })
            ->where('is_active', true)
            ->get();

        $barbers = User::where('branch_id', $branchId)
            ->where('role', 'barber')
            ->where('is_active', true)
            ->get();

        $categories = Category::where('is_active', true)->get();

        // Ambil tax_rate dari branch user (konfigurasi per cabang)
        $branch = $user->branch;
        $taxRate = $branch ? (float) $branch->tax_rate : 10.00;
        $enableTax = $branch ? (bool) $branch->enable_tax : true;

        // Phase 2: Ambil pengaturan diskon member dan promosi aktif
        $memberDiscountRate = (float) \App\Models\Setting::get('member_discount_rate', 0);
        $activePromotions = \App\Models\Promotion::where('is_active', true)
            ->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id');
            })
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->get();

        return Inertia::render('Pos/Index', [
            'services' => $services,
            'categories' => $categories,
            'barbers' => $barbers,
            'current_shift' => $shift,
            'tax_rate' => $taxRate,
            'enable_tax' => $enableTax,
            'member_discount_rate' => $memberDiscountRate,
            'active_promotions' => $activePromotions,
        ]);
    }

    public function storeTransaction(StoreTransactionRequest $request)
    {
        $validated = $request->validated();

        try {
            $user = $request->user();
            $shift = Shift::where('user_id', $user->id)
                ->where('status', 'open')
                ->firstOrFail();

            $transaction = $this->transactionService->processTransaction($validated, $user, $shift);

            return redirect()->back()->with('success', 'Transaksi berhasil disimpan! No: ' . $transaction->transaction_number);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('POS Transaction Failed: ' . $e->getMessage(), [
                'user_id' => $request->user()->id,
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Gagal menyimpan transaksi: ' . $e->getMessage());
        }
    }

    public function searchProducts(Request $request)
    {
        $branchId = $request->user()->branch_id;
        $query = Product::where('branch_id', $branchId)
            ->where('is_active', true);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->take(30)->get()); // Return only 30 products to avoid memory bloat
    }

    public function searchCustomers(Request $request)
    {
        $query = Customer::where('is_active', true);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('name')->take(30)->get());
    }
}
