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
        $dashboardConfig = $this->userService->getDashboardConfig($user);

        return Inertia::render('Dashboard', [
            'config' => $dashboardConfig,
        ]);
    }
}
