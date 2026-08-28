<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IuranSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'amount',
        'effective_from',
        'set_by',
    ];

    /**
     * Get the user who set this rate.
     */
    public function setter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'set_by');
    }
}
