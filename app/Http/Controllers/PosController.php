<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Service;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index(Request $request)
    {
        // Ensure shift is open
        $shift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return redirect()->route('dashboard')->with('error', 'Anda harus membuka shift terlebih dahulu.');
        }

        $branchId = $request->user()->branch_id;

        $services = Service::where('branch_id', $branchId)
            ->orWhereNull('branch_id')
            ->where('is_active', true)
            ->get();

        $products = Product::where('branch_id', $branchId)
            ->where('is_active', true)
            ->get();

        $categories = Category::where('is_active', true)->get();

        $barbers = User::where('branch_id', $branchId)
            ->where('role', 'barber')
            ->where('is_active', true)
            ->get();

        $customers = Customer::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('Pos/Index', [
            'services' => $services,
            'products' => $products,
            'categories' => $categories,
            'barbers' => $barbers,
            'customers' => $customers,
            'current_shift' => $shift,
        ]);
    }

    public function storeTransaction(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required',
            'items.*.name' => 'required|string',
            'items.*.type' => 'required|in:service,product',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'items.*.barber_id' => 'required_if:items.*.type,service',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'required|string',
            'subtotal' => 'required|numeric',
            'tax_amount' => 'required|numeric',
            'total_amount' => 'required|numeric',
            'amount_paid' => 'required|numeric|min:0',
            'change_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $user = $request->user();
            $shift = Shift::where('user_id', $user->id)->where('status', 'open')->firstOrFail();

            // Generate Transaction Number
            $prefix = 'TRX-' . date('Ymd');
            $count = Transaction::whereDate('created_at', date('Y-m-d'))->count() + 1;
            $transactionNumber = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);

            $transaction = Transaction::create([
                'branch_id' => $user->branch_id,
                'shift_id' => $shift->id,
                'cashier_id' => $user->id,
                'customer_id' => $validated['customer_id'] ?? null,
                'transaction_number' => $transactionNumber,
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'],
                'discount_amount' => 0, // TODO: Implement discount logic
                'total_amount' => $validated['total_amount'],
                'payment_method' => $validated['payment_method'],
                'payment_amount' => $validated['amount_paid'],
                'amount_paid' => $validated['amount_paid'],
                'change_amount' => $validated['change_amount'],
                'status' => 'completed',
                'notes' => $validated['notes'],
                'completed_at' => now(),
            ]);

            $totalCommission = 0;

            foreach ($validated['items'] as $item) {
                $commissionAmount = 0;
                $commissionRate = 0;

                if ($item['type'] === 'service') {
                    $barber = User::find($item['barber_id']);
                    if ($barber) {
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

                // Update stock for products
                if ($item['type'] === 'product') {
                    $product = Product::find($item['id']);
                    if ($product) {
                        $product->decrement('stock_quantity', $item['quantity']);
                    }
                }
            }

            // Update transaction with total commission
            $transaction->update(['total_commission' => $totalCommission]);

            DB::commit();

            return redirect()->back()->with('success', 'Transaksi berhasil disimpan! No: ' . $transactionNumber);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('POS Transaction Failed: ' . $e->getMessage(), [
                'user_id' => $request->user()->id,
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Gagal menyimpan transaksi: ' . $e->getMessage());
        }
    }
}

