<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\HouseController;
use App\Http\Controllers\API\ResidentController;
use App\Http\Controllers\API\BillingController;
use App\Http\Controllers\API\TreasuryController;
use App\Http\Controllers\API\RoleManagementController;
use App\Http\Controllers\API\AnnouncementController;
use App\Http\Controllers\API\ComplaintController;
use App\Http\Controllers\API\VotingController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/houses/public', [HouseController::class, 'index']); // Dropdown list on sign up

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Houses API
    Route::get('houses', [HouseController::class, 'index']);
    Route::post('houses', [HouseController::class, 'store']);
    Route::get('houses/{id}', [HouseController::class, 'show']);
    Route::put('houses/{id}', [HouseController::class, 'update']);
    Route::delete('houses/{id}', [HouseController::class, 'destroy']);

    // Resident activations & directory
    Route::get('residents', [ResidentController::class, 'index']);
    Route::get('residents/pending', [ResidentController::class, 'getPending']);
    Route::post('residents/{id}/approve', [ResidentController::class, 'approve']);
    Route::post('residents/{id}/reject', [ResidentController::class, 'reject']);
    Route::get('residents/{id}', [ResidentController::class, 'show']);

    // Invoices and Flat Rates
    Route::get('invoices', [BillingController::class, 'index']);
    Route::get('invoices/{id}', [BillingController::class, 'show']);
    Route::post('invoices/{id}/upload-proof', [BillingController::class, 'uploadProof']);
    Route::post('invoices/{id}/verify', [BillingController::class, 'verifyProof']);
    Route::post('invoices/pay-manual', [BillingController::class, 'payManual']);
    Route::get('iuran-settings', [BillingController::class, 'getSettings']);
    Route::post('iuran-settings', [BillingController::class, 'updateSettings']);

    // Treasury Ledger
    Route::get('treasury/summary', [TreasuryController::class, 'summary']);
    Route::get('treasury/ledger', [TreasuryController::class, 'ledger']);
    Route::post('treasury/expense', [TreasuryController::class, 'recordExpense']);

    // Role mutations (Super Admin)
    Route::get('roles/users', [RoleManagementController::class, 'index']);
    Route::post('roles/change', [RoleManagementController::class, 'changeRole']);

    // Announcements board
    Route::get('announcements', [AnnouncementController::class, 'index']);
    Route::post('announcements', [AnnouncementController::class, 'store']);
    Route::get('announcements/{id}', [AnnouncementController::class, 'show']);
    Route::put('announcements/{id}', [AnnouncementController::class, 'update']);
    Route::delete('announcements/{id}', [AnnouncementController::class, 'destroy']);

    // Complaints
    Route::get('complaints', [ComplaintController::class, 'index']);
    Route::post('complaints', [ComplaintController::class, 'store']);
    Route::get('complaints/{id}', [ComplaintController::class, 'show']);
    Route::post('complaints/{id}/status', [ComplaintController::class, 'updateStatus']);

    // E-Voting
    Route::get('voting', [VotingController::class, 'index']);
    Route::post('voting', [VotingController::class, 'store']);
    Route::post('voting/{id}/vote', [VotingController::class, 'castVote']);
    Route::post('voting/{id}/close', [VotingController::class, 'close']);
});

