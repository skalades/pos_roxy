<?php

namespace App\Http\Middleware;

use App\Models\FeatureAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureAccess
{
    /**
     * Handle an incoming request.
     *
     * Check if the authenticated user's role has access to the specified feature.
     * Usage in routes: ->middleware('feature:pos')
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $featureKey  The feature key to check against (from config/features.php)
     */
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthorized.');
        }

        // super_admin & admin always have full access
        if (in_array($user->role, ['super_admin', 'admin'])) {
            return $next($request);
        }

        // Check feature access for controllable roles (cashier, manager)
        if (!FeatureAccess::isEnabled($featureKey, $user->role)) {
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                return redirect()
                    ->route('dashboard')
                    ->with('error', 'Fitur ini tidak tersedia untuk akun Anda. Hubungi admin untuk mengaktifkan akses.');
            }

            abort(403, 'Fitur ini tidak tersedia untuk akun Anda.');
        }

        return $next($request);
    }
}
