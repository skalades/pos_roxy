<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class House extends Model
{
    use HasFactory;

    protected $fillable = [
        'block',
        'number',
        'full_address',
        'status',
        'notes',
    ];

    /**
     * Get the residents (users) associated with this house.
     */
    public function residents(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the invoices generated for this house.
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
