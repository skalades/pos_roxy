<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'address',
        'latitude',
        'longitude',
        'geofence_radius',
        'require_attendance_for_shift',
        'strict_attendance_policy',
        'attendance_settings',
        'attendance_required_roles',
        'late_tolerance_minutes',
        'auto_mark_alpha',
        'phone',
        'email',
        'manager_id',
        'is_active',
        'opening_time',
        'closing_time',
        'timezone',
        'tax_rate',
        'enable_tax',
        'enable_attendance_deduction',
        'late_penalty_amount',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'tax_rate' => 'decimal:2',
            'enable_tax' => 'boolean',
            'require_attendance_for_shift' => 'boolean',
            'strict_attendance_policy' => 'boolean',
            'attendance_settings' => 'array',
            'attendance_required_roles' => 'array',
            'auto_mark_alpha' => 'boolean',
            'is_active' => 'boolean',
            'enable_attendance_deduction' => 'boolean',
            'late_penalty_amount' => 'decimal:2',
        ];
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
