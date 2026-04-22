<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'date',
        'clock_in_at',
        'clock_in_latitude',
        'clock_in_longitude',
        'clock_in_address',
        'clock_in_photo',
        'clock_in_notes',
        'clock_in_on_time',
        'clock_in_distance',
        'clock_out_at',
        'clock_out_latitude',
        'clock_out_longitude',
        'clock_out_address',
        'clock_out_photo',
        'clock_out_notes',
        'clock_out_on_time',
        'clock_out_distance',
        'total_hours',
        'break_duration',
        'overtime_minutes',
        'status',
        'is_holiday',
        'is_approved',
        'approved_by',
        'approved_at',
        'metadata',
        'admin_notes',
        'clock_in_attempts',
        'clock_out_attempts',
        'error_log',
        'last_gps_update',
        'gps_accuracy',
        'clock_in_photo_verified',
        'clock_out_photo_verified',
        'clock_in_photo_hash',
        'clock_out_photo_hash',
        'device_fingerprint',
        'ip_address',
        'network_location',
        'location_spoofing_detected',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in_at' => 'datetime',
        'clock_out_at' => 'datetime',
        'approved_at' => 'datetime',
        'last_gps_update' => 'datetime',
        'clock_in_on_time' => 'boolean',
        'clock_out_on_time' => 'boolean',
        'is_holiday' => 'boolean',
        'is_approved' => 'boolean',
        'location_spoofing_detected' => 'boolean',
        'metadata' => 'array',
        'error_log' => 'array',
        'network_location' => 'array',
        'clock_in_photo_verified' => 'boolean',
        'clock_out_photo_verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
