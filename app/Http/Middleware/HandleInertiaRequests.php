<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'app_settings' => [
                'app_name' => \App\Models\Setting::get('app_name', 'Roxy POS'),
                'app_logo' => $this->getLogoUrl(\App\Models\Setting::get('app_logo')),
                'receipt_logo' => $this->getLogoUrl(\App\Models\Setting::get('receipt_logo')),
                'app_website' => \App\Models\Setting::get('app_website'),
                'app_instagram' => \App\Models\Setting::get('app_instagram'),
                'app_whatsapp' => \App\Models\Setting::get('app_whatsapp'),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'just_opened' => $request->session()->get('just_opened'),
                'just_closed_data' => $request->session()->get('just_closed_data'),
            ],
        ];
    }

    private function getLogoUrl($logo)
    {
        if (!$logo) return null;
        
        // If it's a full URL from storage, extract the path to make it relative
        // This avoids issues when APP_URL in .env (e.g. localhost) doesn't match the current browser host
        $urlPath = parse_url($logo, PHP_URL_PATH);
        if ($urlPath && str_contains($urlPath, '/storage/')) {
            return $urlPath;
        }

        if (str_starts_with($logo, 'http')) return $logo;
        
        // Ensure path starts with /storage/ and is relative to root
        $path = ltrim($logo, '/');
        if (!str_starts_with($path, 'storage/')) {
            $path = 'storage/' . $path;
        }
        
        return '/' . $path;
    }
}
