<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id', 'monthly_salary', 'commission_rate', 
        'hire_date', 'work_start_time', 'work_end_time', 'day_off'
    ];

    protected $casts = [
        'monthly_salary' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'hire_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
