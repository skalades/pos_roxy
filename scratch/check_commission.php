<?php

use App\Models\TransactionItem;
use App\Models\Service;

$items = TransactionItem::whereHas('transaction', function($q) {
    $q->whereDate('created_at', '2026-04-22');
})->get();

echo "Today's Transaction Items:\n";
foreach ($items as $item) {
    echo "- Item: {$item->item_name}, Rate: {$item->commission_rate}%, Amount: Rp {$item->commission_amount}\n";
}

$services = Service::all();
echo "\nService Commission Rates:\n";
foreach ($services as $service) {
    echo "- Service: {$service->name}, Rate: {$service->commission_rate}%\n";
}
