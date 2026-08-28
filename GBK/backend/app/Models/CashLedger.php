<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashLedger extends Model
{
    use HasFactory;

    protected $table = 'cash_ledger';

    protected $fillable = [
        'type',
        'amount',
        'description',
        'payment_method',
        'reference_id',
        'proof_path',
        'recorded_by',
        'recorded_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'recorded_at' => 'datetime',
    ];

    /**
     * Get the user who recorded this ledger entry.
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
