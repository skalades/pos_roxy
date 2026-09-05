<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FeatureAccessController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

use App\Http\Controllers\ShiftController;
use App\Http\Controllers\PosController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Feature Access Management (super_admin only via admin middleware) ──
    Route::middleware('admin')->group(function () {
        Route::get('/feature-access', [FeatureAccessController::class, 'index'])->name('feature-access.index');
        Route::put('/feature-access', [FeatureAccessController::class, 'update'])->name('feature-access.update');
        Route::post('/feature-access/reset', [FeatureAccessController::class, 'resetDefaults'])->name('feature-access.reset');
    });

    // ── Shift Routes ──
    Route::middleware('feature:shifts')->group(function () {
        Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');
        Route::get('/shifts/current', [ShiftController::class, 'current'])->name('shifts.current');
        Route::post('/shifts/open', [ShiftController::class, 'open'])->name('shifts.open');
        Route::post('/shifts/close', [ShiftController::class, 'close'])->name('shifts.close');
    });

    // ── POS Routes ──
    Route::middleware('feature:pos')->group(function () {
        Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
        Route::get('/pos/api/products', [PosController::class, 'searchProducts'])->name('api.pos.products');
        Route::get('/pos/api/customers', [PosController::class, 'searchCustomers'])->name('api.pos.customers');
        Route::post('/pos/transaction', [PosController::class, 'storeTransaction'])->name('pos.store');
    });

    // ── Customer Routes ──
    Route::post('/customers', [\App\Http\Controllers\CustomerController::class, 'store'])->name('customers.store');

    // ── Transaction Routes ──
    Route::middleware('feature:transactions')->group(function () {
        Route::get('/transactions', [\App\Http\Controllers\TransactionController::class, 'index'])->name('transactions.index');
        Route::get('/transactions/{id}/edit', [\App\Http\Controllers\TransactionController::class, 'edit'])->name('transactions.edit');
        Route::put('/transactions/{id}', [\App\Http\Controllers\TransactionController::class, 'update'])->name('transactions.update');
        Route::get('/transactions/{id}', [\App\Http\Controllers\TransactionController::class, 'show'])->name('transactions.show');
        Route::delete('/transactions/{id}', [\App\Http\Controllers\TransactionController::class, 'destroy'])->name('transactions.destroy');
    });

    // ── Barber Commission Routes ──
    Route::get('/my-commissions', [\App\Http\Controllers\BarberCommissionController::class, 'index'])->name('barber.commissions');

    // ── Attendance Routes ──
    Route::middleware('feature:attendance')->group(function () {
        Route::get('/attendance', [\App\Http\Controllers\AttendanceController::class, 'index'])->name('attendance.index');
        Route::post('/attendance/clock-in', [\App\Http\Controllers\AttendanceController::class, 'clockIn'])->name('attendance.clock-in');
        Route::post('/attendance/clock-out', [\App\Http\Controllers\AttendanceController::class, 'clockOut'])->name('attendance.clock-out');
    });

    // ── Expense Routes ──
    Route::middleware('feature:expenses')->group(function () {
        Route::get('/expenses', [\App\Http\Controllers\ExpenseController::class, 'index'])->name('expenses.index');
        Route::post('/expenses', [\App\Http\Controllers\ExpenseController::class, 'store'])->name('expenses.store');
        Route::delete('/expenses/{expense}', [\App\Http\Controllers\ExpenseController::class, 'destroy'])->name('expenses.destroy');
    });

    // ── Product & Service Management ──
    Route::middleware('feature:categories')->group(function () {
        Route::resource('categories', \App\Http\Controllers\CategoryController::class);
    });
    Route::middleware('feature:services')->group(function () {
        Route::resource('services', \App\Http\Controllers\ServiceController::class);
    });
    Route::middleware('feature:products')->group(function () {
        Route::resource('products', \App\Http\Controllers\ProductController::class);
        Route::post('/products/{product}/adjust-stock', [\App\Http\Controllers\ProductController::class, 'adjustStock'])->name('products.adjust-stock');
    });

    // ── Branch Routes ──
    Route::middleware('feature:branches')->group(function () {
        Route::resource('branches', \App\Http\Controllers\BranchController::class);
    });

    // ── User Routes ──
    Route::middleware('feature:users')->group(function () {
        Route::resource('users', \App\Http\Controllers\UserController::class);
    });

    // ── Payroll Routes ──
    Route::middleware('feature:payroll')->group(function () {
        Route::get('/payroll', [\App\Http\Controllers\PayrollController::class, 'index'])->name('payroll.index');
        Route::get('/payroll/export', [\App\Http\Controllers\PayrollController::class, 'exportPdf'])->name('payroll.export');
        Route::get('/payroll/{user}', [\App\Http\Controllers\PayrollController::class, 'show'])->name('payroll.show');
        Route::post('/payroll/generate', [\App\Http\Controllers\PayrollController::class, 'generate'])->name('payroll.generate');
    });

    // ── Ranking Routes ──
    Route::middleware('feature:ranking')->group(function () {
        Route::get('/ranking', [\App\Http\Controllers\RankingController::class, 'index'])->name('ranking.index');
    });

    // ── Finance Report Routes ──
    Route::middleware('feature:finance_reports')->group(function () {
        Route::get('/reports/finance', [\App\Http\Controllers\FinanceController::class, 'index'])->name('reports.finance');
        Route::get('/reports/finance/export', [\App\Http\Controllers\FinanceController::class, 'exportPdf'])->name('reports.finance.export');
        Route::get('/reports/shifts', [\App\Http\Controllers\ShiftReportController::class, 'index'])->name('reports.shifts');
        Route::get('/reports/shifts/{id}', [\App\Http\Controllers\ShiftReportController::class, 'show'])->name('reports.shifts.show');
    });

    // ── Setting Routes (admin middleware + feature check) ──
    Route::middleware(['admin', 'feature:settings'])->group(function () {
        Route::get('/settings', [\App\Http\Controllers\SettingController::class, 'index'])->name('settings.index');
        Route::post('/settings/ui', [\App\Http\Controllers\SettingController::class, 'updateBranding'])->name('settings.ui');
        Route::post('/settings/ui/delete-logo', [\App\Http\Controllers\SettingController::class, 'deleteLogo'])->name('settings.ui.delete-logo');
        Route::post('/settings/branch/{branch}', [\App\Http\Controllers\SettingController::class, 'updateBranch'])->name('settings.branch');
        Route::post('/settings/loyalty', [\App\Http\Controllers\SettingController::class, 'updateLoyalty'])->name('settings.loyalty');
        Route::resource('promotions', \App\Http\Controllers\PromotionController::class);
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
