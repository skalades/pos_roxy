<?php

namespace App\Services;

use App\Models\User;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\FeatureAccess;
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
            'expenses_enabled' => FeatureAccess::isEnabled('expenses', $role),
            'branch_summaries' => $role === 'super_admin' ? $this->getBranchSummaries() : null,
        ];

        return $config;
    }

    private function getBranchSummaries(): array
    {
        $today = now()->startOfDay();
        $todayStr = now()->toDateString();
        $branches = \App\Models\Branch::where('is_active', true)->get();
        
        $summaries = [];
        foreach ($branches as $branch) {
            $revenue = Transaction::where('branch_id', $branch->id)
                ->where('status', 'completed')
                ->where('created_at', '>=', $today)
                ->sum('total_amount');
                
            $customers = Transaction::where('branch_id', $branch->id)
                ->where('status', 'completed')
                ->where('created_at', '>=', $today)
                ->count();
                
            $onTime = \App\Models\Attendance::whereHas('user', function($q) use ($branch) {
                $q->where('branch_id', $branch->id);
            })->where('date', $todayStr)->where('clock_in_on_time', true)->count();

            $lateAttendances = \App\Models\Attendance::with('user')->whereHas('user', function($q) use ($branch) {
                $q->where('branch_id', $branch->id);
            })->where('date', $todayStr)->where('clock_in_on_time', false)->get();
            
            $lateCount = $lateAttendances->count();
            $lateNames = $lateAttendances->pluck('user.name')->toArray();
                
            $summaries[] = [
                'id' => $branch->id,
                'name' => $branch->name,
                'revenue' => 'Rp ' . number_format($revenue, 0, ',', '.'),
                'customers' => $customers,
                'ontime' => $onTime,
                'late' => $lateCount,
                'late_names' => $lateNames,
            ];
        }
        
        return $summaries;
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
        $registry = config('features.registry', []);
        $items = [];

        // ── Feature-based menu items ────────────────────────────
        // Each menu item is linked to a feature_key from config/features.php.
        // Items are only shown if the feature is enabled for the user's role.
        
        $featureMenuMap = [
            'pos' => [
                'title'       => 'Kasir POS',
                'description' => 'Mulai transaksi baru',
                'icon'        => 'ShoppingBag',
                'href'        => '/pos',
                'color'       => 'teal',
                'roles'       => ['admin', 'manager', 'cashier'],
            ],
            'attendance' => [
                'title'       => 'Absen Selfie',
                'description' => 'Masuk & Pulang',
                'icon'        => 'Camera',
                'href'        => '/attendance',
                'color'       => 'emerald',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier', 'barber'],
            ],
            'finance_reports' => [
                'title'       => 'Laporan Keuangan',
                'description' => 'Analisa omzet & profit',
                'icon'        => 'BarChart3',
                'href'        => '/reports/finance',
                'color'       => 'blue',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier'],
            ],
            'services' => [
                'title'       => 'Manajemen Layanan',
                'description' => 'Kelola jasa & komisi',
                'icon'        => 'Scissors',
                'href'        => '/services',
                'color'       => 'indigo',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier'],
            ],
            'products' => [
                'title'       => 'Manajemen Produk',
                'description' => 'Stok & inventaris',
                'icon'        => 'Package',
                'href'        => '/products',
                'color'       => 'blue',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier'],
            ],
            'categories' => [
                'title'       => 'Kategori',
                'description' => 'Grup produk & jasa',
                'icon'        => 'Tag',
                'href'        => '/categories',
                'color'       => 'amber',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier'],
            ],
            'users' => [
                'title'       => 'Manajemen User',
                'description' => 'Kelola staff & akses',
                'icon'        => 'Users',
                'href'        => '/users',
                'color'       => 'indigo',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier'],
            ],
            'branches' => [
                'title'       => 'Manajemen Cabang',
                'description' => 'Kelola outlet & lokasi',
                'icon'        => 'MapPin',
                'href'        => '/branches',
                'color'       => 'cyan',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier'],
            ],
            'payroll' => [
                'title'       => 'HR & Payroll',
                'description' => 'Manajemen gaji & absen',
                'icon'        => 'Wallet',
                'href'        => '/payroll',
                'color'       => 'rose',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier'],
            ],
            'ranking' => [
                'title'       => 'Peringkat',
                'description' => 'Analisa performa bisnis',
                'icon'        => 'Trophy',
                'href'        => '/ranking',
                'color'       => 'amber',
                'roles'       => ['super_admin', 'admin', 'manager', 'cashier'],
            ],
            'settings' => [
                'title'       => 'Pengaturan Sistem',
                'description' => 'Branding & Operasional',
                'icon'        => 'Settings',
                'href'        => '/settings',
                'color'       => 'slate',
                'roles'       => ['super_admin', 'admin', 'manager'],
            ],
        ];

        // Build menu items filtered by role + feature access
        foreach ($featureMenuMap as $featureKey => $menuItem) {
            // Skip if role is not in the allowed roles for this menu item
            if (!in_array($role, $menuItem['roles'])) {
                continue;
            }

            // Check feature access (super_admin & admin always pass)
            if (!FeatureAccess::isEnabled($featureKey, $role)) {
                continue;
            }

            $items[] = [
                'title'       => $menuItem['title'],
                'description' => $menuItem['description'],
                'icon'        => $menuItem['icon'],
                'href'        => $menuItem['href'],
                'color'       => $menuItem['color'],
            ];
        }

        // ── Transaction/Commission History (always available) ───
        if ($role === 'barber') {
            $items[] = [
                'title'       => 'Riwayat Komisi',
                'description' => 'Cek histori kerja',
                'icon'        => 'History',
                'href'        => '/my-commissions',
                'color'       => 'rose',
            ];
        } elseif (FeatureAccess::isEnabled('transactions', $role)) {
            $items[] = [
                'title'       => 'Riwayat Transaksi',
                'description' => 'Cek histori kerja',
                'icon'        => 'History',
                'href'        => '/transactions',
                'color'       => 'rose',
            ];
        }

        // ── Shift Kasir (cashier-specific, but toggleable) ──────
        if (FeatureAccess::isEnabled('shifts', $role)) {
            if ($role === 'cashier') {
                $items[] = [
                    'title'       => 'Shift Kasir',
                    'description' => 'Buka/Tutup laci kas',
                    'icon'        => 'Store',
                    'href'        => '/shifts',
                    'color'       => 'amber',
                ];
            }
        }

        // ── Laporan Shift (super_admin & admin) ───────────
        if (in_array($role, ['super_admin', 'admin'])) {
            $items[] = [
                'title'       => 'Laporan Shift',
                'description' => 'Monitoring aktivitas kasir',
                'icon'        => 'Store',
                'href'        => '/reports/shifts',
                'color'       => 'amber',
            ];
        }

        // ── Feature Access Control (super_admin only) ───────────
        if ($role === 'super_admin') {
            $items[] = [
                'title'       => 'Kontrol Akses',
                'description' => 'Kelola fitur per role',
                'icon'        => 'ShieldCheck',
                'href'        => '/feature-access',
                'color'       => 'purple',
            ];
        }

        // ── Profile (always available for everyone) ─────────────
        $items[] = [
            'title'       => 'Profil Saya',
            'description' => 'Pengaturan akun',
            'icon'        => 'User',
            'href'        => '/profile',
            'color'       => 'violet',
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
