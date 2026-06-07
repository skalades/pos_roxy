<?php

/**
 * Feature Registry Configuration
 * 
 * Central registry of all toggleable features in the system.
 * Each feature defines its metadata and default access per role.
 * 
 * To add a new feature:
 * 1. Add an entry to the 'registry' array below
 * 2. Add the 'feature:key' middleware to the relevant routes in web.php
 * 3. Run: php artisan db:seed --class=FeatureAccessSeeder
 * 
 * Structure:
 *   'feature_key' => [
 *       'name'        => Display name (Indonesian)
 *       'description' => Short description
 *       'icon'        => Lucide React icon name
 *       'color'       => Tailwind color key for the nav card
 *       'group'       => Feature group for UI organization
 *       'defaults'    => Default enabled state per role
 *   ]
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Controllable Roles
    |--------------------------------------------------------------------------
    |
    | Roles whose feature access can be toggled by super_admin.
    | super_admin and admin always have full access.
    |
    */

    'controllable_roles' => ['cashier', 'manager'],

    /*
    |--------------------------------------------------------------------------
    | Role Labels (Indonesian)
    |--------------------------------------------------------------------------
    */

    'role_labels' => [
        'cashier' => 'Kasir',
        'manager' => 'Manager',
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Groups
    |--------------------------------------------------------------------------
    */

    'groups' => [
        'operations' => 'Operasional',
        'management' => 'Manajemen',
        'reports'    => 'Laporan & Analisa',
        'system'     => 'Sistem',
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Registry
    |--------------------------------------------------------------------------
    */

    'registry' => [

        // ── Operasional ─────────────────────────────────────────

        'pos' => [
            'name'        => 'Kasir POS',
            'description' => 'Mulai transaksi baru',
            'icon'        => 'ShoppingBag',
            'color'       => 'teal',
            'group'       => 'operations',
            'defaults'    => [
                'cashier' => true,
                'manager' => true,
            ],
        ],

        'shifts' => [
            'name'        => 'Shift Kasir',
            'description' => 'Buka/Tutup laci kas',
            'icon'        => 'Store',
            'color'       => 'amber',
            'group'       => 'operations',
            'defaults'    => [
                'cashier' => true,
                'manager' => false,
            ],
        ],

        'expenses' => [
            'name'        => 'Pengeluaran',
            'description' => 'Catat operasional',
            'icon'        => 'Banknote',
            'color'       => 'rose',
            'group'       => 'operations',
            'defaults'    => [
                'cashier' => true,
                'manager' => false,
            ],
        ],

        'transactions' => [
            'name'        => 'Riwayat Transaksi',
            'description' => 'Cek histori kerja',
            'icon'        => 'History',
            'color'       => 'rose',
            'group'       => 'operations',
            'defaults'    => [
                'cashier' => true,
                'manager' => true,
            ],
        ],

        'attendance' => [
            'name'        => 'Absen Selfie',
            'description' => 'Masuk & Pulang',
            'icon'        => 'Camera',
            'color'       => 'emerald',
            'group'       => 'operations',
            'defaults'    => [
                'cashier' => true,
                'manager' => true,
            ],
        ],

        // ── Manajemen ───────────────────────────────────────────

        'services' => [
            'name'        => 'Manajemen Layanan',
            'description' => 'Kelola jasa & komisi',
            'icon'        => 'Scissors',
            'color'       => 'indigo',
            'group'       => 'management',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

        'products' => [
            'name'        => 'Manajemen Produk',
            'description' => 'Stok & inventaris',
            'icon'        => 'Package',
            'color'       => 'blue',
            'group'       => 'management',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

        'categories' => [
            'name'        => 'Kategori',
            'description' => 'Grup produk & jasa',
            'icon'        => 'Tag',
            'color'       => 'amber',
            'group'       => 'management',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

        'users' => [
            'name'        => 'Manajemen User',
            'description' => 'Kelola staff & akses',
            'icon'        => 'Users',
            'color'       => 'indigo',
            'group'       => 'management',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

        'branches' => [
            'name'        => 'Manajemen Cabang',
            'description' => 'Kelola outlet & lokasi',
            'icon'        => 'MapPin',
            'color'       => 'cyan',
            'group'       => 'management',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

        // ── Laporan & Analisa ───────────────────────────────────

        'finance_reports' => [
            'name'        => 'Laporan Keuangan',
            'description' => 'Analisa omzet & profit',
            'icon'        => 'BarChart3',
            'color'       => 'blue',
            'group'       => 'reports',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

        'payroll' => [
            'name'        => 'HR & Payroll',
            'description' => 'Manajemen gaji & absen',
            'icon'        => 'Wallet',
            'color'       => 'rose',
            'group'       => 'reports',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

        'ranking' => [
            'name'        => 'Peringkat',
            'description' => 'Analisa performa bisnis',
            'icon'        => 'Trophy',
            'color'       => 'amber',
            'group'       => 'reports',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

        // ── Sistem ──────────────────────────────────────────────

        'settings' => [
            'name'        => 'Pengaturan Sistem',
            'description' => 'Branding & Operasional',
            'icon'        => 'Settings',
            'color'       => 'slate',
            'group'       => 'system',
            'defaults'    => [
                'cashier' => false,
                'manager' => true,
            ],
        ],

    ],

];
