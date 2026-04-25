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
            'nav_cards' => $this->getMenuItemsByRole($role),
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

        if (in_array($role, ['admin', 'manager', 'cashier'])) {
            $items[] = [
                'title' => 'Kasir POS',
                'description' => 'Mulai transaksi baru',
                'icon' => 'ShoppingBag',
                'href' => '/pos',
                'color' => 'teal',
            ];
        }

        $items[] = [
            'title' => 'Absen Selfie',
            'description' => 'Masuk & Pulang',
            'icon' => 'Camera',
            'href' => '/attendance',
            'color' => 'emerald',
        ];

        if (in_array($role, ['super_admin', 'admin', 'manager'])) {
            $items[] = [
                'title' => 'Laporan Keuangan',
                'description' => 'Analisa omzet & profit',
                'icon' => 'BarChart3',
                'href' => '/reports/finance',
                'color' => 'blue',
            ];
            $items[] = [
                'title' => 'Manajemen Layanan',
                'description' => 'Kelola jasa & komisi',
                'icon' => 'Scissors',
                'href' => '/services',
                'color' => 'indigo',
            ];
            $items[] = [
                'title' => 'Manajemen Produk',
                'description' => 'Stok & inventaris',
                'icon' => 'Package',
                'href' => '/products',
                'color' => 'blue',
            ];
            $items[] = [
                'title' => 'Kategori',
                'description' => 'Grup produk & jasa',
                'icon' => 'Tag',
                'href' => '/categories',
                'color' => 'amber',
            ];
            $items[] = [
                'title' => 'Manajemen User',
                'description' => 'Kelola staff & akses',
                'icon' => 'Users',
                'href' => '/users',
                'color' => 'indigo',
            ];
            $items[] = [
                'title' => 'Manajemen Cabang',
                'description' => 'Kelola outlet & lokasi',
                'icon' => 'MapPin',
                'href' => '/branches',
                'color' => 'cyan',
            ];
            $items[] = [
                'title' => 'HR & Payroll',
                'description' => 'Manajemen gaji & absen',
                'icon' => 'Wallet',
                'href' => '/payroll',
                'color' => 'rose',
            ];
            $items[] = [
                'title' => 'Peringkat',
                'description' => 'Analisa performa bisnis',
                'icon' => 'Trophy',
                'href' => '/ranking',
                'color' => 'amber',
            ];
            $items[] = [
                'title' => 'Pengaturan Sistem',
                'description' => 'Branding & Operasional',
                'icon' => 'Settings',
                'href' => '/settings',
                'color' => 'slate',
            ];
        }

        $items[] = [
            'title' => $role === 'barber' ? 'Riwayat Komisi' : 'Riwayat Transaksi',
            'description' => 'Cek histori kerja',
            'icon' => 'History',
            'href' => $role === 'barber' ? '/my-commissions' : '/transactions',
            'color' => 'rose',
        ];

        if ($role === 'cashier') {
            $items[] = [
                'title' => 'Shift Kasir',
                'description' => 'Buka/Tutup laci kas',
                'icon' => 'Store',
                'href' => '/shifts',
                'color' => 'amber',
            ];
        }

        $items[] = [
            'title' => 'Profil Saya',
            'description' => 'Pengaturan akun',
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
                    'icon' => 'Wallet',
                    'color' => 'teal'
                ],
                [
                    'title' => 'Layanan Selesai', 
                    'value' => (string) \App\Models\TransactionItem::where('barber_id', $user->id)
                        ->whereHas('transaction', function($q) use ($today) {
                            $q->where('created_at', '>=', $today)->where('status', 'completed');
                        })->count(), 
                    'icon' => 'CheckCircle',
                    'color' => 'emerald'
                ],
            ],
            'cashier' => [
                [
                    'title' => 'Sales Toko', 
                    'value' => 'Rp ' . number_format($trxQuery->clone()->where('status', 'completed')->sum('total_amount'), 0, ',', '.'), 
                    'icon' => 'Calculator',
                    'color' => 'teal'
                ],
                [
                    'title' => 'Antrean Pelanggan', 
                    'value' => (string) $trxQuery->clone()->where('status', 'pending')->count(), 
                    'icon' => 'Users', 
                    'color' => 'rose'
                ],
            ],
            default => [
                [
                    'title' => 'Total Revenue', 
                    'value' => 'Rp ' . number_format($trxQuery->clone()->where('status', 'completed')->sum('total_amount'), 0, ',', '.'), 
                    'icon' => 'TrendingUp',
                    'color' => 'emerald'
                ],
                [
                    'title' => 'Total Customers', 
                    'value' => (string) $trxQuery->clone()->where('status', 'completed')->count(), 
                    'icon' => 'Users',
                    'color' => 'blue'
                ],
            ],
        };
    }
}
