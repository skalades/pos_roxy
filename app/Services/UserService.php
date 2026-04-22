<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class UserService extends BaseService
{
    /**
     * Get user dashboard configuration based on permissions.
     * 
     * @param User $user
     * @return array
     */
    public function getDashboardConfig(User $user): array
    {
        $role = $user->role; // We'll keep using the role column for now until Step 2 is done
        
        $config = [
            'title' => $this->getDashboardTitle($role),
            'menu_items' => $this->getMenuItemsByRole($role),
            'stats' => $this->getStatsByRole($role, $user),
        ];

        return $config;
    }

    private function getDashboardTitle(string $role): string
    {
        return match ($role) {
            'super_admin' => 'HQ Overview',
            'admin', 'manager' => 'Branch Management',
            'cashier' => 'Cashier Dashboard',
            'barber' => 'Barber Dashboard',
            default => 'Dashboard',
        };
    }

    private function getMenuItemsByRole(string $role): array
    {
        // This will be more dynamic once Permissions are implemented
        $items = [];

        if (in_array($role, ['super_admin', 'admin', 'manager', 'cashier'])) {
            $items[] = [
                'title' => 'Kasir POS',
                'icon' => 'ShoppingBag',
                'href' => '#',
                'color' => 'teal',
            ];
        }

        $items[] = [
            'title' => 'Absen Selfie',
            'icon' => 'Camera',
            'href' => '#',
            'color' => 'emerald',
        ];

        if (in_array($role, ['super_admin', 'admin', 'manager'])) {
            $items[] = [
                'title' => 'Laporan Penjualan',
                'icon' => 'BarChart3',
                'href' => '#',
                'color' => 'blue',
            ];
            $items[] = [
                'title' => 'Manajemen User',
                'icon' => 'Users',
                'href' => '#',
                'color' => 'indigo',
            ];
        }

        if ($role === 'cashier') {
            $items[] = [
                'title' => 'Shift Kasir',
                'icon' => 'Store',
                'href' => '#',
                'color' => 'amber',
            ];
        }

        $items[] = [
            'title' => 'Profil Saya',
            'icon' => 'User',
            'href' => '/profile',
            'color' => 'violet',
        ];

        return $items;
    }

    private function getStatsByRole(string $role, User $user): array
    {
        // Placeholders for now
        return match ($role) {
            'barber' => [
                ['title' => 'Komisi Hari Ini', 'value' => 'Rp 0', 'icon' => 'Wallet'],
                ['title' => 'Selesai', 'value' => '0', 'icon' => 'CheckCircle'],
            ],
            'cashier' => [
                ['title' => 'Sales Toko', 'value' => 'Rp 0', 'icon' => 'Calculator'],
                ['title' => 'Antrean', 'value' => '0', 'icon' => 'Users', 'color' => 'accent'],
            ],
            default => [
                ['title' => 'Revenue', 'value' => 'Rp 0', 'icon' => 'TrendingUp'],
                ['title' => 'Customers', 'value' => '0', 'icon' => 'Users'],
            ],
        };
    }
}
