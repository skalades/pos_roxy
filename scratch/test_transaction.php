<?php

use App\Models\User;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Service;
use Illuminate\Support\Facades\DB;

// Use a known user (ID 3 based on logs)
$user = User::find(3);
if (!$user) {
    echo "User 3 not found\n";
    exit;
}

// Find or create an open shift
$shift = Shift::where('user_id', $user->id)->where('status', 'open')->first();
if (!$shift) {
    echo "Creating a new shift for testing...\n";
    $shift = Shift::create([
        'branch_id' => $user->branch_id,
        'user_id' => $user->id,
        'opening_balance' => 500000,
        'opened_at' => now(),
        'status' => 'open'
    ]);
}

echo "Using Shift ID: {$shift->id}\n";

// Find a service
$service = Service::first();
if (!$service) {
    echo "No services found in DB\n";
    exit;
}

echo "Using Service: {$service->name} (Price: {$service->price})\n";

try {
    DB::beginTransaction();
    
    $prefix = 'TRX-' . date('Ymd');
    $count = Transaction::whereDate('created_at', date('Y-m-d'))->count() + 1;
    $transactionNumber = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);
    
    echo "Generating Transaction: {$transactionNumber}\n";

    $transaction = Transaction::create([
        'branch_id' => $user->branch_id,
        'shift_id' => $shift->id,
        'cashier_id' => $user->id,
        'customer_id' => null,
        'transaction_number' => $transactionNumber,
        'subtotal' => $service->price,
        'tax_amount' => $service->price * 0.1,
        'discount_amount' => 0,
        'total_amount' => $service->price * 1.1,
        'payment_method' => 'cash',
        'amount_paid' => $service->price * 1.1,
        'payment_amount' => $service->price * 1.1,
        'change_amount' => 0,
        'status' => 'completed',
        'notes' => 'Test transaction from scratch script',
        'completed_at' => now(),
    ]);

    echo "Created Transaction ID: {$transaction->id}\n";

    $totalCommission = 0;
    
    TransactionItem::create([
        'transaction_id' => $transaction->id,
        'item_type' => 'service',
        'item_id' => $service->id,
        'item_name' => $service->name,
        'barber_id' => 1, // Assume barber ID 1 exists
        'quantity' => 1,
        'unit_price' => $service->price,
        'subtotal' => $service->price,
        'total_price' => $service->price,
        'commission_rate' => $service->commission_rate ?? 0,
        'commission_amount' => $service->price * (($service->commission_rate ?? 0) / 100),
    ]);
    
    $totalCommission += ($service->price * (($service->commission_rate ?? 0) / 100));

    $transaction->update(['total_commission' => $totalCommission]);
    
    DB::commit();
    echo "Transaction COMMITTED successfully!\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "Transaction FAILED: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
