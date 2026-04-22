CREATE TABLE `appointments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `service_id` bigint(20) UNSIGNED NOT NULL,
  `barber_id` bigint(20) UNSIGNED NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `appointment_number` varchar(255) NOT NULL,
  `appointment_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `estimated_price` decimal(10,2) NOT NULL,
  `status` enum('scheduled','confirmed','in_progress','completed','paid','cancelled','no_show') DEFAULT 'scheduled',
  `notes` text DEFAULT NULL,
  `customer_notes` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attendances` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `clock_in_at` timestamp NULL DEFAULT NULL,
  `clock_in_latitude` decimal(10,8) DEFAULT NULL,
  `clock_in_longitude` decimal(11,8) DEFAULT NULL,
  `clock_in_address` varchar(255) DEFAULT NULL,
  `clock_in_photo` text DEFAULT NULL,
  `clock_in_notes` text DEFAULT NULL,
  `clock_in_on_time` tinyint(1) NOT NULL DEFAULT 1,
  `clock_in_distance` int(11) DEFAULT NULL,
  `clock_out_at` timestamp NULL DEFAULT NULL,
  `clock_out_latitude` decimal(10,8) DEFAULT NULL,
  `clock_out_longitude` decimal(11,8) DEFAULT NULL,
  `clock_out_address` varchar(255) DEFAULT NULL,
  `clock_out_photo` text DEFAULT NULL,
  `clock_out_notes` text DEFAULT NULL,
  `clock_out_on_time` tinyint(1) NOT NULL DEFAULT 1,
  `clock_out_distance` int(11) DEFAULT NULL,
  `total_hours` int(11) DEFAULT NULL,
  `break_duration` int(11) DEFAULT NULL,
  `overtime_minutes` int(11) DEFAULT NULL,
  `status` enum('present','late','absent','half_day','overtime','sick_leave','personal_leave','alpha') DEFAULT 'present',
  `is_holiday` tinyint(1) NOT NULL DEFAULT 0,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `admin_notes` text DEFAULT NULL,
  `clock_in_attempts` int(11) NOT NULL DEFAULT 0,
  `clock_out_attempts` int(11) NOT NULL DEFAULT 0,
  `error_log` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`error_log`)),
  `last_gps_update` timestamp NULL DEFAULT NULL,
  `gps_accuracy` decimal(8,2) DEFAULT NULL,
  `clock_in_photo_verified` tinyint(1) NOT NULL DEFAULT 0,
  `clock_out_photo_verified` tinyint(1) NOT NULL DEFAULT 0,
  `clock_in_photo_hash` varchar(255) DEFAULT NULL,
  `clock_out_photo_hash` varchar(255) DEFAULT NULL,
  `device_fingerprint` varchar(255) DEFAULT NULL COMMENT 'Device fingerprint for security tracking',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP address during attendance',
  `network_location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Network-based location as backup' CHECK (json_valid(`network_location`)),
  `location_spoofing_detected` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Flag if location spoofing is detected',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attendance_audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `attendance_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` text NOT NULL,
  `device_fingerprint` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `gps_accuracy` decimal(8,2) DEFAULT NULL,
  `distance_from_branch` int(11) DEFAULT NULL,
  `within_geofence` tinyint(1) DEFAULT NULL,
  `photo_provided` tinyint(1) NOT NULL DEFAULT 0,
  `photo_hash` varchar(255) DEFAULT NULL,
  `photo_verified` tinyint(1) DEFAULT NULL,
  `location_spoofing_detected` tinyint(1) NOT NULL DEFAULT 0,
  `suspicious_activity` tinyint(1) NOT NULL DEFAULT 0,
  `anomaly_flags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`anomaly_flags`)),
  `request_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`request_data`)),
  `response_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_data`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `performed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(10) NOT NULL,
  `address` text DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `geofence_radius` int(10) UNSIGNED NOT NULL DEFAULT 100 COMMENT 'Geofence radius in meters for GPS-based attendance',
  `require_attendance_for_shift` tinyint(1) NOT NULL DEFAULT 0,
  `strict_attendance_policy` tinyint(1) NOT NULL DEFAULT 0,
  `attendance_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attendance_settings`)),
  `attendance_required_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of roles that require attendance: ["cashier", "barber"]' CHECK (json_valid(`attendance_required_roles`)),
  `late_tolerance_minutes` int(11) NOT NULL DEFAULT 15 COMMENT 'Grace period in minutes before marking as late',
  `auto_mark_alpha` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Automatically mark as alpha if no attendance and no approved leave',
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `manager_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `opening_time` time NOT NULL DEFAULT '08:00:00',
  `closing_time` time NOT NULL DEFAULT '21:00:00',
  `timezone` varchar(50) NOT NULL DEFAULT 'Asia/Jakarta',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `branch_audits` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `branch_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cash_operations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `shift_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('cash_in','cash_out','count','adjustment') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('service','product') NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_item_id` bigint(20) UNSIGNED NOT NULL,
  `barber_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `rate` decimal(5,2) NOT NULL,
  `status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Original/Primary branch - for reference only, customer can be accessed from any branch',
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_loyalty_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `transaction_sequence` int(11) NOT NULL COMMENT 'Sequential transaction number for this customer at this branch',
  `per_transaction_discount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Per-transaction loyalty discount applied',
  `milestone_discount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Milestone bonus discount applied',
  `is_milestone_transaction` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this transaction qualified for milestone discount',
  `milestone_frequency` int(11) DEFAULT NULL COMMENT 'Milestone frequency setting at time of transaction',
  `milestone_discount_percentage` decimal(5,2) DEFAULT NULL COMMENT 'Milestone discount percentage at time of transaction',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leave_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('sick_leave','personal_leave','emergency_leave','annual_leave') NOT NULL DEFAULT 'personal_leave',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int(11) NOT NULL DEFAULT 1,
  `reason` text NOT NULL,
  `attachment` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approval_notes` text DEFAULT NULL,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `loyalty_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `per_transaction_discount` decimal(10,2) NOT NULL DEFAULT 10000.00 COMMENT 'Fixed discount amount per transaction for loyalty members',
  `milestone_frequency` int(11) NOT NULL DEFAULT 10 COMMENT 'Every Nth transaction gets milestone discount (e.g., every 10th transaction)',
  `milestone_discount_percentage` decimal(5,2) NOT NULL DEFAULT 50.00 COMMENT 'Percentage discount for milestone transactions',
  `additional_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON field for future loyalty program features' CHECK (json_valid(`additional_settings`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payroll_components` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payroll_record_id` bigint(20) UNSIGNED NOT NULL,
  `component_type` enum('allowance','bonus','deduction','commission','overtime') NOT NULL,
  `component_name` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `calculation_basis` text DEFAULT NULL,
  `calculation_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`calculation_data`)),
  `source_table` varchar(255) DEFAULT NULL,
  `source_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_taxable` tinyint(1) NOT NULL DEFAULT 1,
  `is_prorated` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payroll_records` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `period_month` int(11) NOT NULL,
  `period_year` int(11) NOT NULL,
  `base_salary` decimal(12,2) NOT NULL DEFAULT 0.00,
  `allowances_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `commissions_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `bonuses_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `overtime_pay` decimal(12,2) NOT NULL DEFAULT 0.00,
  `deductions_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `bpjs_tk_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `bpjs_kesehatan_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_deduction` decimal(10,2) NOT NULL DEFAULT 0.00,
  `penalty_deductions` decimal(10,2) NOT NULL DEFAULT 0.00,
  `gross_salary` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_working_days` int(11) NOT NULL DEFAULT 0,
  `days_present` int(11) NOT NULL DEFAULT 0,
  `days_late` int(11) NOT NULL DEFAULT 0,
  `days_absent` int(11) NOT NULL DEFAULT 0,
  `overtime_hours` int(11) NOT NULL DEFAULT 0,
  `total_services` int(11) NOT NULL DEFAULT 0,
  `total_service_revenue` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','pending_approval','approved','paid','cancelled') NOT NULL DEFAULT 'draft',
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `calculation_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`calculation_details`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payroll_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('super_admin','admin','manager','cashier','barber') NOT NULL,
  `base_salary_min` decimal(12,2) NOT NULL DEFAULT 0.00,
  `base_salary_max` decimal(12,2) NOT NULL DEFAULT 0.00,
  `enable_salary_range` tinyint(1) NOT NULL DEFAULT 0,
  `transport_allowance` decimal(10,2) NOT NULL DEFAULT 500000.00,
  `enable_transport_allowance` tinyint(1) NOT NULL DEFAULT 1,
  `meal_allowance` decimal(10,2) NOT NULL DEFAULT 600000.00,
  `enable_meal_allowance` tinyint(1) NOT NULL DEFAULT 1,
  `health_allowance` decimal(10,2) NOT NULL DEFAULT 400000.00,
  `enable_health_allowance` tinyint(1) NOT NULL DEFAULT 1,
  `attendance_bonus_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `enable_attendance_bonus` tinyint(1) NOT NULL DEFAULT 1,
  `performance_bonus_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `enable_performance_bonus` tinyint(1) NOT NULL DEFAULT 1,
  `punctuality_bonus` decimal(10,2) NOT NULL DEFAULT 0.00,
  `enable_punctuality_bonus` tinyint(1) NOT NULL DEFAULT 1,
  `late_penalty` decimal(10,2) NOT NULL DEFAULT 25000.00,
  `enable_late_penalty` tinyint(1) NOT NULL DEFAULT 1,
  `absent_penalty_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `enable_absent_penalty` tinyint(1) NOT NULL DEFAULT 1,
  `overtime_rate` decimal(5,2) NOT NULL DEFAULT 150.00,
  `overtime_threshold_minutes` int(11) NOT NULL DEFAULT 480,
  `enable_overtime` tinyint(1) NOT NULL DEFAULT 1,
  `bpjs_tk_rate` decimal(5,2) NOT NULL DEFAULT 2.00,
  `enable_bpjs_tk` tinyint(1) NOT NULL DEFAULT 1,
  `bpjs_kesehatan_rate` decimal(5,2) NOT NULL DEFAULT 1.00,
  `enable_bpjs_kesehatan` tinyint(1) NOT NULL DEFAULT 1,
  `enable_role_barber` tinyint(1) NOT NULL DEFAULT 1,
  `enable_role_cashier` tinyint(1) NOT NULL DEFAULT 1,
  `enable_role_manager` tinyint(1) NOT NULL DEFAULT 1,
  `enable_role_admin` tinyint(1) NOT NULL DEFAULT 1,
  `enable_role_super_admin` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `additional_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_settings`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `min_stock_level` int(11) NOT NULL DEFAULT 5,
  `barcode` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`filters`)),
  `columns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`columns`)),
  `schedule` varchar(255) DEFAULT NULL,
  `last_generated_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 30,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shifts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `opening_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `closing_balance` decimal(10,2) DEFAULT NULL,
  `expected_balance` decimal(10,2) DEFAULT NULL,
  `difference` decimal(10,2) DEFAULT NULL,
  `opened_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `closed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `shift_id` bigint(20) UNSIGNED DEFAULT NULL,
  `cashier_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED DEFAULT NULL,
  `barber_id` bigint(20) UNSIGNED DEFAULT NULL,
  `transaction_number` varchar(50) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `barber_commission` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_commission` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('cash','card','digital_wallet','bank_transfer','edc','qris') NOT NULL,
  `amount_paid` decimal(10,2) DEFAULT NULL,
  `payment_amount` decimal(10,2) NOT NULL,
  `change_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payment_details`)),
  `status` enum('pending','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `discount_type` varchar(255) DEFAULT NULL,
  `discount_value` decimal(8,2) DEFAULT NULL,
  `discount_reason` varchar(255) DEFAULT NULL,
  `loyalty_per_transaction_discount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Loyalty program per-transaction discount amount',
  `loyalty_milestone_discount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Loyalty program milestone bonus discount amount',
  `total_loyalty_discount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Total loyalty discount (per-transaction + milestone)',
  `is_loyalty_transaction` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this transaction used loyalty program benefits',
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` bigint(20) UNSIGNED DEFAULT NULL,
  `deletion_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transaction_deletion_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `requested_by` bigint(20) UNSIGNED NOT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approval_notes` text DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transaction_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_id` bigint(20) UNSIGNED NOT NULL,
  `item_type` enum('service','product') NOT NULL,
  `item_id` bigint(20) UNSIGNED NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_description` text DEFAULT NULL,
  `barber_id` bigint(20) UNSIGNED DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_price` decimal(10,2) NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `commission_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `item_metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`item_metadata`)),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `work_start_time` time NOT NULL DEFAULT '09:30:00',
  `work_end_time` time NOT NULL DEFAULT '20:00:00',
  `day_off` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') DEFAULT NULL,
  `role` enum('super_admin','admin','manager','cashier','barber') NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `monthly_salary` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Monthly base salary or honor fee in Rupiah',
  `can_access_all_branches` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `avatar` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `appointments`
ALTER TABLE `attendances`
ALTER TABLE `attendance_audit_logs`
ALTER TABLE `branches`
ALTER TABLE `branch_audits`
ALTER TABLE `branch_notifications`
ALTER TABLE `cash_operations`
ALTER TABLE `categories`
ALTER TABLE `commissions`
ALTER TABLE `customers`
ALTER TABLE `customer_loyalty_transactions`
ALTER TABLE `failed_jobs`
ALTER TABLE `leave_requests`
ALTER TABLE `loyalty_settings`
ALTER TABLE `migrations`
ALTER TABLE `password_reset_tokens`
ALTER TABLE `payroll_components`
ALTER TABLE `payroll_records`
ALTER TABLE `payroll_settings`
ALTER TABLE `personal_access_tokens`
ALTER TABLE `products`
ALTER TABLE `reports`
ALTER TABLE `services`
ALTER TABLE `shifts`
ALTER TABLE `transactions`
ALTER TABLE `transaction_deletion_requests`
ALTER TABLE `transaction_items`
ALTER TABLE `users`
ALTER TABLE `appointments`
ALTER TABLE `attendances`
ALTER TABLE `attendance_audit_logs`
ALTER TABLE `branches`
ALTER TABLE `branch_audits`
ALTER TABLE `branch_notifications`
ALTER TABLE `cash_operations`
ALTER TABLE `categories`
ALTER TABLE `commissions`
ALTER TABLE `customers`
ALTER TABLE `customer_loyalty_transactions`
ALTER TABLE `failed_jobs`
ALTER TABLE `leave_requests`
ALTER TABLE `loyalty_settings`
ALTER TABLE `migrations`
ALTER TABLE `payroll_components`
ALTER TABLE `payroll_records`
ALTER TABLE `payroll_settings`
ALTER TABLE `personal_access_tokens`
ALTER TABLE `products`
ALTER TABLE `reports`
ALTER TABLE `services`
ALTER TABLE `shifts`
ALTER TABLE `transactions`
ALTER TABLE `transaction_deletion_requests`
ALTER TABLE `transaction_items`
ALTER TABLE `users`
ALTER TABLE `appointments`
ALTER TABLE `attendances`
ALTER TABLE `attendance_audit_logs`
ALTER TABLE `branches`
ALTER TABLE `cash_operations`
ALTER TABLE `commissions`
ALTER TABLE `customers`
ALTER TABLE `customer_loyalty_transactions`
ALTER TABLE `leave_requests`
ALTER TABLE `loyalty_settings`
ALTER TABLE `payroll_components`
ALTER TABLE `payroll_records`
ALTER TABLE `payroll_settings`
ALTER TABLE `products`
ALTER TABLE `reports`
ALTER TABLE `services`
ALTER TABLE `shifts`
ALTER TABLE `transactions`
ALTER TABLE `transaction_deletion_requests`
ALTER TABLE `transaction_items`
ALTER TABLE `users`
