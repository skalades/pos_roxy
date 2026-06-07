<?php

namespace App\Services;

use App\Models\FeatureAccess;
use Illuminate\Support\Collection;

class FeatureAccessService extends BaseService
{
    /**
     * Get the full feature registry from config.
     *
     * @return array<string, array>
     */
    public function getRegistry(): array
    {
        return config('features.registry', []);
    }

    /**
     * Get roles that can be controlled by super_admin.
     *
     * @return array<string>
     */
    public function getControllableRoles(): array
    {
        return config('features.controllable_roles', ['cashier', 'manager']);
    }

    /**
     * Get role labels for display.
     *
     * @return array<string, string>
     */
    public function getRoleLabels(): array
    {
        return config('features.role_labels', []);
    }

    /**
     * Get feature groups for UI organization.
     *
     * @return array<string, string>
     */
    public function getGroups(): array
    {
        return config('features.groups', []);
    }

    /**
     * Build the complete access matrix for the management UI.
     * Returns all features with their current enabled/disabled state per controllable role.
     *
     * @return array
     */
    public function getAccessMatrix(): array
    {
        $registry = $this->getRegistry();
        $roles = $this->getControllableRoles();
        $groups = $this->getGroups();

        // Fetch all feature_access records in one query
        $accessRecords = FeatureAccess::all()
            ->groupBy('role')
            ->map(fn ($items) => $items->keyBy('feature_key'));

        $matrix = [];

        foreach ($registry as $key => $feature) {
            $roleAccess = [];

            foreach ($roles as $role) {
                $record = $accessRecords->get($role)?->get($key);
                $defaultEnabled = $feature['defaults'][$role] ?? true;

                $roleAccess[$role] = [
                    'is_enabled' => $record ? $record->is_enabled : $defaultEnabled,
                    'is_default' => $record ? ($record->is_enabled === $defaultEnabled) : true,
                ];
            }

            $matrix[] = [
                'key'         => $key,
                'name'        => $feature['name'],
                'description' => $feature['description'],
                'icon'        => $feature['icon'],
                'color'       => $feature['color'],
                'group'       => $feature['group'],
                'group_label' => $groups[$feature['group']] ?? $feature['group'],
                'roles'       => $roleAccess,
            ];
        }

        return $matrix;
    }

    /**
     * Get summary counts per role (enabled/total).
     *
     * @return array<string, array{enabled: int, total: int}>
     */
    public function getRoleSummary(): array
    {
        $matrix = $this->getAccessMatrix();
        $roles = $this->getControllableRoles();
        $summary = [];

        foreach ($roles as $role) {
            $total = count($matrix);
            $enabled = collect($matrix)->filter(fn ($f) => $f['roles'][$role]['is_enabled'])->count();

            $summary[$role] = [
                'enabled' => $enabled,
                'total'   => $total,
            ];
        }

        return $summary;
    }

    /**
     * Update the access state for a specific feature + role.
     *
     * @param string $featureKey
     * @param string $role
     * @param bool   $isEnabled
     * @return bool
     */
    public function updateAccess(string $featureKey, string $role, bool $isEnabled): bool
    {
        $registry = $this->getRegistry();

        // Validate feature key exists in registry
        if (!isset($registry[$featureKey])) {
            return false;
        }

        // Validate role is controllable
        if (!in_array($role, $this->getControllableRoles())) {
            return false;
        }

        FeatureAccess::updateOrCreate(
            ['feature_key' => $featureKey, 'role' => $role],
            ['is_enabled' => $isEnabled]
        );

        // Clear cache for this role
        FeatureAccess::clearCache($role);

        return true;
    }

    /**
     * Check if a feature is enabled for a given role.
     * Delegates to model's cached static method.
     *
     * @param string $featureKey
     * @param string $role
     * @return bool
     */
    public function isFeatureEnabled(string $featureKey, string $role): bool
    {
        return FeatureAccess::isEnabled($featureKey, $role);
    }

    /**
     * Get list of enabled feature keys for a role.
     *
     * @param string $role
     * @return array<string>
     */
    public function getEnabledFeatureKeys(string $role): array
    {
        $registry = $this->getRegistry();
        $enabled = [];

        foreach ($registry as $key => $feature) {
            if (FeatureAccess::isEnabled($key, $role)) {
                $enabled[] = $key;
            }
        }

        return $enabled;
    }

    /**
     * Reset all feature access to defaults from config.
     *
     * @return void
     */
    public function resetToDefaults(): void
    {
        $registry = $this->getRegistry();
        $roles = $this->getControllableRoles();

        foreach ($registry as $key => $feature) {
            foreach ($roles as $role) {
                $defaultEnabled = $feature['defaults'][$role] ?? true;

                FeatureAccess::updateOrCreate(
                    ['feature_key' => $key, 'role' => $role],
                    ['is_enabled' => $defaultEnabled]
                );
            }
        }

        // Clear all cached feature access
        FeatureAccess::clearCache();
    }
}
