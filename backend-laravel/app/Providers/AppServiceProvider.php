<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Rate limiter for general auth checks (15 requests per minute per IP)
        RateLimiter::for('auth-check', function (Request $request) {
            return Limit::perMinute(15)->by($request->ip());
        });

        // Strict rate limiter for sending OTP (3 OTP requests per 10 minutes per IP / email)
        RateLimiter::for('otp-send', function (Request $request) {
            $key = $request->input('email') ? $request->ip() . '|' . strtolower(trim($request->input('email'))) : $request->ip();
            return Limit::perMinutes(10, 3)->by($key);
        });

        // Strict rate limiter for login / OTP verification attempts (5 attempts per minute)
        RateLimiter::for('auth-attempts', function (Request $request) {
            $key = $request->input('email') ? $request->ip() . '|' . strtolower(trim($request->input('email'))) : $request->ip();
            return Limit::perMinute(5)->by($key);
        });

        // ==========================================
        // Authorization Gates for CodeZen Hierarchy
        // ==========================================

        // Gate: Full Presidential / Executive Control (President & VP)
        Gate::define('manage-all', function (User $user) {
            return $user->isExecutive();
        });

        // Gate: Team Management (Executive can manage any team; Lead can manage their own team)
        Gate::define('manage-team', function (User $user, ?string $teamName = null) {
            if ($user->isExecutive()) {
                return true;
            }
            if (!$teamName) {
                return $user->isLead();
            }
            return $user->canManageTeam($teamName);
        });
    }
}
