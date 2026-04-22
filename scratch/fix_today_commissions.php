<?php

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

$today = now()->startOfDay();
$items = TransactionItem::where('item_type', 'service')
    ->where('commission_amount', 0)
    ->whereHas('transaction', function($q) use ($today) {
        $q->where('created_at', '>=', $today)->where('status', 'completed');
    })->get();

echo "Found " . $items->count() . " items to fix.\n";

foreach ($items as $item) {
    $barber = User::find($item->barber_id);
    if ($barber && $barber->commission_rate > 0) {
        $newCommission = $item->subtotal * ($barber->commission_rate / 100);
        
        echo "- Fixing {$item->item_name} for {$barber->name}: Rp {$item->subtotal} x {$barber->commission_rate}% = Rp {$newCommission}\n";
        
        $item->update([
            'commission_rate' => $barber->commission_rate,
            'commission_amount' => $newCommission
        ]);
        
        // Update parent transaction total commission
        $transaction = $item->transaction;
        $totalComm = TransactionItem::where('transaction_id', $transaction->id)->sum('commission_amount');
        $transaction->update(['total_commission' => $totalComm]);
    }
}

echo "\nFixing COMPLETED!\n";
