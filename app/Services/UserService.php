<?php

namespace App\Services;

use App\Models\User;
use App\Models\Shift;
use App\Models\Transaction;
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
        $role = $user->role;
        
        $activeShift = Shift::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        $config = [
            'title' => $this->getDashboardTitle($role),
            'menu_items' => $this->getMenuItemsByRole($role),
            'stats' => $this->getStatsByRole($role, $user),
            'active_shift' => $activeShift,
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
                'href' => '/pos',
                'color' => 'teal',
            ];
        }

        $items[] = [
            'title' => 'Absen Selfie',
            'icon' => 'Camera',
            'href' => '/attendance',
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

        $items[] = [
            'title' => $role === 'barber' ? 'Riwayat Komisi' : 'Riwayat Transaksi',
            'icon' => 'History',
            'href' => $role === 'barber' ? '/my-commissions' : '/transactions',
            'color' => 'rose',
        ];

        if ($role === 'cashier') {
            $items[] = [
                'title' => 'Shift Kasir',
                'icon' => 'Store',
                'href' => '/shifts',
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
        $today = now()->startOfDay();
        
        // Base query for transactions
        $trxQuery = Transaction::where('created_at', '>=', $today);
        if ($user->role !== 'super_admin') {
            $trxQuery->where('branch_id', $user->branch_id);
        }

        return match ($role) {
            'barber' => [
                [
                    'title' => 'Komisi Hari Ini', 
                    'value' => 'Rp ' . number_format(
                        \App\Models\TransactionItem::where('barber_id', $user->id)
                            ->whereHas('transaction', function($q) use ($today) {
                                $q->where('created_at', '>=', $today)->where('status', 'completed');
                            })->sum('commission_amount'), 
                        0, ',', '.'
                    ), 
                    'icon' => 'Wallet'
                ],
                [
                    'title' => 'Selesai', 
                    'value' => (string) \App\Models\TransactionItem::where('barber_id', $user->id)
                        ->whereHas('transaction', function($q) use ($today) {
                            $q->where('created_at', '>=', $today)->where('status', 'completed');
                        })->count(), 
                    'icon' => 'CheckCircle'
                ],
            ],
            'cashier' => [
                [
                    'title' => 'Sales Toko', 
                    'value' => 'Rp ' . number_format($trxQuery->clone()->where('status', 'completed')->sum('total_amount'), 0, ',', '.'), 
                    'icon' => 'Calculator'
                ],
                [
                    'title' => 'Antrean', 
                    'value' => (string) $trxQuery->clone()->where('status', 'pending')->count(), 
                    'icon' => 'Users', 
                    'color' => 'accent'
                ],
            ],
            default => [
                [
                    'title' => 'Revenue', 
                    'value' => 'Rp ' . number_format($trxQuery->clone()->where('status', 'completed')->sum('total_amount'), 0, ',', '.'), 
                    'icon' => 'TrendingUp'
                ],
                [
                    'title' => 'Customers', 
                    'value' => (string) $trxQuery->clone()->where('status', 'completed')->count(), 
                    'icon' => 'Users'
                ],
            ],
        };
    }
}
