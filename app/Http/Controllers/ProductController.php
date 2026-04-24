<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manage', Product::class);

        $user = $request->user();
        $query = Product::query()->with(['category', 'branch']);

        // Restrictions for branch managers
        if ($user->role === 'manager' || $user->role === 'admin') {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('barcode', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return Inertia::render('Products/Index', [
            'products' => $query->latest()->get(),
            'categories' => Category::where('type', 'product')->get(),
            'branches' => Branch::all(),
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage', Product::class);

        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_level' => 'required|integer|min:0',
            'barcode' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'image' => 'nullable|string',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            $product = Product::create($validated);

            if ($product->stock_quantity > 0) {
                \App\Models\ProductStockLog::create([
                    'product_id' => $product->id,
                    'user_id' => auth()->id(),
                    'type' => 'in',
                    'quantity' => $product->stock_quantity,
                    'old_stock' => 0,
                    'new_stock' => $product->stock_quantity,
                    'reason' => 'Stok awal saat pembuatan produk',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Produk berhasil ditambahkan.');
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        Gate::authorize('manage', Product::class);

        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'min_stock_level' => 'required|integer|min:0',
            'barcode' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'image' => 'nullable|string',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($product, $validated) {
            $oldStock = $product->stock_quantity;
            $newStock = (int) $validated['stock_quantity'];

            if ($oldStock !== $newStock) {
                \App\Models\ProductStockLog::create([
                    'product_id' => $product->id,
                    'user_id' => auth()->id(),
                    'type' => 'adjustment',
                    'quantity' => $newStock - $oldStock,
                    'old_stock' => $oldStock,
                    'new_stock' => $newStock,
                    'reason' => 'Manual update from dashboard',
                ]);
            }

            $product->update($validated);
        });

        return redirect()->back()->with('success', 'Produk berhasil diperbarui.');
    }

    public function adjustStock(Request $request, Product $product): RedirectResponse
    {
        Gate::authorize('manage', Product::class);

        $validated = $request->validate([
            'adjustment' => 'required|integer',
            'reason' => 'nullable|string|max:255',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($product, $validated) {
            $oldStock = $product->stock_quantity;
            $adjustment = (int) $validated['adjustment'];
            $newStock = $oldStock + $adjustment;

            if ($newStock < 0) {
                throw new \Exception('Stok tidak boleh kurang dari nol.');
            }

            \App\Models\ProductStockLog::create([
                'product_id' => $product->id,
                'user_id' => auth()->id(),
                'type' => $adjustment > 0 ? 'in' : 'out',
                'quantity' => $adjustment,
                'old_stock' => $oldStock,
                'new_stock' => $newStock,
                'reason' => $validated['reason'] ?? 'Stock adjustment',
            ]);

            $product->update(['stock_quantity' => $newStock]);
        });

        return redirect()->back()->with('success', 'Stok berhasil disesuaikan.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        Gate::authorize('manage', Product::class);

        $product->delete();

        return redirect()->back()->with('success', 'Produk berhasil dihapus.');
    }

}
