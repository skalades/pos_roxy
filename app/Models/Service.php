<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'branch_id', 'category_id', 'name', 'description', 
        'price', 'duration_minutes', 'commission_rate', 
        'is_active', 'image'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
