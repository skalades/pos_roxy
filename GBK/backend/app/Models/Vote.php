<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'options',
        'deadline',
        'created_by',
        'is_active',
    ];

    protected $casts = [
        'options' => 'json',
        'deadline' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user who created the vote/poll.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the responses (ballots) cast for this vote/poll.
     */
    public function responses(): HasMany
    {
        return $this->hasMany(VoteResponse::class);
    }
}
