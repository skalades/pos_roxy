<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'period',
        'base_salary',
        'total_commission',
        'total_deduction',
        'net_salary',
        'status',
        'notes',
        'processed_at',
        'processed_by',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'total_commission' => 'decimal:2',
        'total_deduction' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
