<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductStockLog extends Model
{
    protected $fillable = [
        'product_id', 
        'user_id', 
        'type', 
        'quantity', 
        'old_stock', 
        'new_stock', 
        'reason'
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
