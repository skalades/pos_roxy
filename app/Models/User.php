<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use App\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'branch_id',
        'name',
        'email',
        'phone',
        'address',
        'hire_date',
        'work_start_time',
        'work_end_time',
        'day_off',
        'role',
        'commission_rate',
        'monthly_salary',
        'can_access_all_branches',
        'is_active',
        'avatar',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'hire_date' => 'date',
            'is_active' => 'boolean',
            'can_access_all_branches' => 'boolean',
            'commission_rate' => 'decimal:2',
            'monthly_salary' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function profile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function attendances(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function transactionItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TransactionItem::class, 'barber_id');
    }
}
