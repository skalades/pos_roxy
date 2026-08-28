<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'house_id',
        'month',
        'year',
        'kebersihan_amount',
        'air_amount',
        'total_amount',
        'status',
        'payment_method',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'kebersihan_amount' => 'decimal:2',
        'air_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    /**
     * Get the house that this invoice belongs to.
     */
    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    /**
     * Get the user who verified this invoice.
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Get the payment proof associated with this invoice.
     */
    public function paymentProof(): HasOne
    {
        return $this->hasOne(PaymentProof::class);
    }
}
