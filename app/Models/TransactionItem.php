<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransactionItem extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'transaction_id', 'item_type', 'item_id', 'item_name',
        'item_description', 'barber_id', 'quantity', 'unit_price',
        'subtotal', 'discount_amount', 'total_price',
        'commission_rate', 'commission_amount', 'item_metadata'
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'total_price' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'item_metadata' => 'array',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function barber(): BelongsTo
    {
        return $this->belongsTo(User::class, 'barber_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(
            $this->item_type === 'service' ? Service::class : Product::class, 
            'item_id'
        );
    }
}
