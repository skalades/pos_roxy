<?php

namespace Database\Seeders;

use App\Models\FeatureAccess;
use Illuminate\Database\Seeder;

class FeatureAccessSeeder extends Seeder
{
    /**
     * Seed the feature_access table with defaults from config.
     * Uses updateOrCreate so it's safe to run multiple times.
     */
    public function run(): void
    {
        $registry = config('features.registry', []);
        $roles = config('features.controllable_roles', ['cashier', 'manager']);

        foreach ($registry as $key => $feature) {
            foreach ($roles as $role) {
                $defaultEnabled = $feature['defaults'][$role] ?? true;

                FeatureAccess::updateOrCreate(
                    ['feature_key' => $key, 'role' => $role],
                    ['is_enabled' => $defaultEnabled]
                );
            }
        }

        $this->command->info('Feature access defaults seeded successfully.');
    }
}
