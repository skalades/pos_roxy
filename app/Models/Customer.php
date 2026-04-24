<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'email',
        'phone',
        'address',
        'date_of_birth',
        'gender',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'date_of_birth' => 'date',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    // TODO: Uncomment ketika model Appointment sudah dibuat
    // public function appointments(): HasMany
    // {
    //     return $this->hasMany(Appointment::class);
    // }
}
