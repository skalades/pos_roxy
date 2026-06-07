<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class FeatureAccess extends Model
{
    protected $table = 'feature_access';

    protected $fillable = [
        'feature_key',
        'role',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
        ];
    }

    /* ───────────────────────────────────────────────
     * Scopes
     * ─────────────────────────────────────────────── */

    public function scopeForRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    public function scopeForFeature($query, string $featureKey)
    {
        return $query->where('feature_key', $featureKey);
    }

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /* ───────────────────────────────────────────────
     * Static Helpers
     * ─────────────────────────────────────────────── */

    /**
     * Check if a feature is enabled for a given role.
     * Results are cached for performance.
     */
    public static function isEnabled(string $featureKey, string $role): bool
    {
        // super_admin & admin always have full access
        if (in_array($role, ['super_admin', 'admin'])) {
            return true;
        }

        // Only cashier & manager are controlled
        if (!in_array($role, ['cashier', 'manager'])) {
            return true;
        }

        $cacheKey = "feature_access:{$role}:{$featureKey}";

        return Cache::remember($cacheKey, 300, function () use ($featureKey, $role) {
            $record = static::where('feature_key', $featureKey)
                ->where('role', $role)
                ->first();

            // If no record exists, default to enabled
            return $record ? $record->is_enabled : true;
        });
    }

    /**
     * Clear cached feature access for a specific role or all roles.
     */
    public static function clearCache(?string $role = null): void
    {
        $roles = $role ? [$role] : ['cashier', 'manager'];
        $features = config('features.registry', []);

        foreach ($roles as $r) {
            foreach ($features as $key => $feature) {
                Cache::forget("feature_access:{$r}:{$key}");
            }
        }
    }
}
