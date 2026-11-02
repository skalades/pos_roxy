<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataCleanupLog extends Model
{
    use HasFactory;

    protected $table = 'data_cleanup_logs';

    protected $fillable = [
        'user_id',
        'year',
        'month',
        'branch_id',
        'modules',
        'records_deleted',
        'files_deleted',
        'bytes_freed',
        'summary',
        'options',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'records_deleted' => 'integer',
        'files_deleted' => 'integer',
        'bytes_freed' => 'integer',
        'modules' => 'array',
        'summary' => 'array',
        'options' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
