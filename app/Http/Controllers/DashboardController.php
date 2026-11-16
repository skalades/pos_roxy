<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Display the dynamic dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $filters = [
            'period'     => $request->input('period', 'today'),
            'start_date' => $request->input('start_date', ''),
            'end_date'   => $request->input('end_date', ''),
        ];

        $dashboardConfig = $this->userService->getDashboardConfig($user, $filters);

        return Inertia::render('Dashboard', [
            'config'  => $dashboardConfig,
            'filters' => $dashboardConfig['filters'] ?? $filters,
        ]);
    }
}
