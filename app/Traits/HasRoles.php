<?php

namespace App\Traits;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait HasRoles
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles');
    }

    public function hasRole(string|array $role): bool
    {
        // Fallback to 'role' column if exists
        if (isset($this->role)) {
            if (is_array($role)) {
                if (in_array($this->role, $role)) return true;
            } else {
                if ($this->role === $role) return true;
                // Check with underscore too (e.g. superadmin vs super_admin)
                if (str_replace('_', '', $this->role) === str_replace('_', '', $role)) return true;
            }
        }

        try {
            if (is_array($role)) {
                return $this->roles()->whereIn('slug', $role)->exists();
            }
            return $this->roles()->where('slug', $role)->exists();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function hasPermission(string $permission): bool
    {
        try {
            return $this->roles()->whereHas('permissions', function ($query) use ($permission) {
                $query->where('slug', $permission);
            })->exists();
        } catch (\Exception $e) {
            return false;
        }
    }
}
