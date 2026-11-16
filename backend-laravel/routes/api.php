<?php

use App\Http\Controllers\Api\AcademicController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Dynamic Academic Details
Route::get('/academic-options', [AcademicController::class, 'getOptions']);
Route::get('/academic-options.php', [AcademicController::class, 'getOptions']);

// Public Leadership & Core Team Showcase Endpoint
// Executives: President, Vice President, Faculty Coordinator (Top 3)
// Core Team: Other team members approved with `show_on_website` = true
Route::get('/leadership', function () {
    $allWebsiteMembers = \App\Models\User::where('show_on_website', true)
        ->orderBy('website_order', 'asc')
        ->orderBy('id', 'asc')
        ->select('id', 'name', 'position', 'role', 'type', 'team', 'tag', 'bio', 'avatar', 'linkedin', 'github', 'email', 'website_order')
        ->get();

    // 1. Strict Executive Trio (President, Vice President, Faculty Coordinator)
    $executives = $allWebsiteMembers->filter(function ($u) {
        $pos = strtolower($u->position ?? '');
        return str_contains($pos, 'president') || str_contains($pos, 'faculty');
    })->values();

    // 2. Core Team members (any team member with show_on_website=true who is not part of the top 3 executive trio)
    $executiveIds = $executives->pluck('id')->toArray();
    $coreTeam = $allWebsiteMembers->filter(function ($u) use ($executiveIds) {
        return !in_array($u->id, $executiveIds);
    })->values();

    // 3. Dynamic Avatar Stack (avatars from active team members & community builders)
    $teamAvatars = \App\Models\User::whereNotNull('avatar')
        ->where('avatar', '!=', '')
        ->orderBy('show_on_website', 'desc')
        ->orderBy('id', 'desc')
        ->limit(6)
        ->pluck('avatar')
        ->toArray();

    $totalMemberCount = \App\Models\User::count();

    return response()->json([
        'success' => true,
        'leaders' => $executives,
        'core_team' => $coreTeam,
        'avatar_stack' => $teamAvatars,
        'total_members_count' => $totalMemberCount,
    ]);
});

// Public Members Directory Endpoint (All verified team members & leads for /members page)
Route::get('/members', function () {
    $members = \App\Models\User::whereIn('role', ['Admin', 'Team'])
        ->orWhere('show_on_website', true)
        ->orderBy('show_on_website', 'desc')
        ->orderBy('website_order', 'asc')
        ->orderBy('id', 'asc')
        ->select('id', 'name', 'position', 'role', 'type', 'team', 'tag', 'bio', 'avatar', 'linkedin', 'github', 'email', 'show_on_website', 'website_order')
        ->get();

    $stats = [
        'total' => $members->count(),
        'leads' => $members->filter(fn($m) => $m->type === 'Lead' || $m->role === 'Admin' || $m->type === 'Admin')->count(),
        'domains' => $members->pluck('team')->filter()->unique()->count(),
    ];

    return response()->json([
        'success' => true,
        'members' => $members,
        'stats' => $stats,
    ]);
});

// Public Events Listing Endpoint (Only Public events are surfaced to the public website)
Route::get('/events', function (Request $request) {
    $events = \App\Models\Event::where('visibility', 'Public')
        ->withCount('registrations')
        ->orderBy('id', 'desc')
        ->get();

    // Check if user is authenticated via Bearer token to return their registered event IDs
    $userRegisteredEventIds = [];
    $user = auth('sanctum')->user();
    if ($user) {
        $userRegisteredEventIds = \App\Models\EventRegistration::where('user_id', $user->id)
            ->pluck('event_id')
            ->map(fn($id) => (string)$id)
            ->toArray();
    }

    return response()->json([
        'success' => true,
        'events' => $events,
        'user_registered_event_ids' => $userRegisteredEventIds,
    ]);
});

// Public Store Products Endpoint
Route::get('/store/products', function () {
    $products = \App\Models\StoreProduct::where('status', '!=', 'Draft')
        ->orderBy('id', 'desc')
        ->get();

    return response()->json([
        'success' => true,
        'products' => $products,
    ]);
});

// Store Pre-Order / Purchase endpoint
Route::post('/store/order', function (Request $request) {
    $validated = $request->validate([
        'product_id' => 'nullable|integer',
        'product_name' => 'required|string|max:200',
        'product_sku' => 'nullable|string|max:50',
        'category' => 'nullable|string|max:100',
        'size' => 'nullable|string|max:20',
        'price' => 'nullable|numeric',
        'quantity' => 'nullable|integer|min:1',
        'buyer_name' => 'required|string|max:150',
        'buyer_email' => 'required|email|max:150',
        'roll_no' => 'nullable|string|max:50',
        'pickup_notes' => 'nullable|string|max:1000',
    ]);

    $user = auth('sanctum')->user();
    $userId = $user ? $user->id : null;
    $price = floatval($validated['price'] ?? 0);
    $quantity = intval($validated['quantity'] ?? 1);
    $totalAmount = $price * $quantity;
    
    $orderNumber = 'CZ-ORD-' . strtoupper(dechex(time())) . '-' . rand(100, 999);
    $pickupToken = 'TOKEN-' . strtoupper(bin2hex(random_bytes(4)));

    $order = \App\Models\StoreOrder::create([
        'order_number' => $orderNumber,
        'user_id' => $userId,
        'product_id' => $validated['product_id'] ?? null,
        'product_name' => $validated['product_name'],
        'product_sku' => $validated['product_sku'] ?? null,
        'category' => $validated['category'] ?? null,
        'size' => $validated['size'] ?? null,
        'price' => $price,
        'quantity' => $quantity,
        'total_amount' => $totalAmount,
        'buyer_name' => $validated['buyer_name'],
        'buyer_email' => $validated['buyer_email'],
        'roll_no' => $validated['roll_no'] ?? null,
        'pickup_notes' => $validated['pickup_notes'] ?? null,
        'status' => 'Confirmed',
        'pickup_token' => $pickupToken,
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Order request created successfully.',
        'order' => $order,
    ]);
});

// Event Registration for authenticated students
Route::post('/events/{id}/register', function (Request $request, $id) {
    $user = $request->user();
    $event = \App\Models\Event::findOrFail($id);

    // 1. Strict Profile Completion Verification
    $missingFields = [];
    if (empty($user->phone)) $missingFields[] = 'Phone Number';
    if (empty($user->roll_no)) $missingFields[] = 'Roll Number';
    if (empty($user->college)) $missingFields[] = 'College';
    if (empty($user->department)) $missingFields[] = 'Department';
    if (empty($user->course)) $missingFields[] = 'Course';

    if (!empty($missingFields)) {
        return response()->json([
            'success' => false,
            'incomplete_profile' => true,
            'missing_fields' => $missingFields,
            'error' => 'Please complete your student profile before registering for events. Missing: ' . implode(', ', $missingFields),
        ], 422);
    }

    // 2. Check if registration is open
    if (!$event->registration_open) {
        return response()->json([
            'success' => false,
            'error' => 'Registrations for this event are currently closed.',
        ], 422);
    }

    $existing = \App\Models\EventRegistration::where('event_id', $id)
        ->where('user_id', $user->id)
        ->first();

    if ($existing) {
        return response()->json([
            'success' => true,
            'message' => 'Already registered for this event.',
            'registration' => $existing,
        ]);
    }

    // Generate unique participant QR token: CZ-EV{event_id}-U{user_id}-{random_hex}
    $qrToken = 'CZ-EV' . $event->id . '-U' . $user->id . '-' . bin2hex(random_bytes(6));

    $registration = \App\Models\EventRegistration::create([
        'event_id' => $event->id,
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'roll_no' => $user->roll_no,
        'college' => $user->college,
        'status' => 'Confirmed',
        'qr_token' => $qrToken,
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Successfully registered for ' . $event->title,
        'registration' => $registration,
    ]);
})->middleware('auth:sanctum');

// Authentication routes with security rate limiting
Route::prefix('auth')->group(function () {
    // RESTful endpoints
    Route::post('/check-email', [AuthController::class, 'checkEmail'])->middleware('throttle:auth-check');
    Route::post('/register', [AuthController::class, 'registerDirect'])->middleware('throttle:auth-attempts');
    Route::post('/send-otp', [AuthController::class, 'sendOtp'])->middleware('throttle:otp-send');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:auth-attempts');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-attempts');
    Route::post('/set-password', [AuthController::class, 'setPassword'])->middleware('throttle:auth-attempts');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:otp-send');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth-attempts');
    Route::post('/google-auth', [AuthController::class, 'googleAuth'])->middleware('throttle:auth-check');

    // Legacy compatibility with .php extension
    Route::post('/check-email.php', [AuthController::class, 'checkEmail'])->middleware('throttle:auth-check');
    Route::post('/register.php', [AuthController::class, 'registerDirect'])->middleware('throttle:auth-attempts');
    Route::post('/send-otp.php', [AuthController::class, 'sendOtp'])->middleware('throttle:otp-send');
    Route::post('/verify-otp.php', [AuthController::class, 'verifyOtp'])->middleware('throttle:auth-attempts');
    Route::post('/login.php', [AuthController::class, 'login'])->middleware('throttle:auth-attempts');
    Route::post('/set-password.php', [AuthController::class, 'setPassword'])->middleware('throttle:auth-attempts');
    Route::post('/forgot-password.php', [AuthController::class, 'forgotPassword'])->middleware('throttle:otp-send');
    Route::post('/reset-password.php', [AuthController::class, 'resetPassword'])->middleware('throttle:auth-attempts');
    Route::post('/google-auth.php', [AuthController::class, 'googleAuth'])->middleware('throttle:auth-check');
});

// Protected routes with Laravel Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'roll_no' => $user->roll_no,
            'department' => $user->department,
            'branch' => $user->branch,
            'course' => $user->course,
            'semester' => $user->semester,
            'college' => $user->college,
            'university' => $user->university,
            'role' => $user->role,
            'type' => $user->type,
            'team' => $user->team,
            'position' => $user->position,
            'tag' => $user->tag,
            'bio' => $user->bio,
            'avatar' => $user->avatar,
            'linkedin' => $user->linkedin,
            'github' => $user->github,
            'profile_completed' => (bool)$user->profile_completed,
            'can_scan_qr' => (bool)$user->can_scan_qr,
            'is_admin' => $user->isExecutive(),
            'is_lead' => $user->isLead(),
            'rbac_role' => $user->getEffectiveRbacRole(),
            'permissions' => $user->getAssignedPermissions(),
        ]);
    });

    // Session validation check (lightweight heartbeat)
    Route::get('/auth/session-check', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'valid' => true,
            'user_id' => $user->id,
            'role' => $user->role,
        ]);
    });

    // Secure Logout (revokes current session / access token)
    Route::post('/auth/logout', function (Request $request) {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully. Session invalidated.',
        ]);
    });

    // Logout from all devices (revokes all personal access tokens)
    Route::post('/auth/logout-all', function (Request $request) {
        $user = $request->user();
        if ($user) {
            $user->tokens()->delete();
        }
        return response()->json([
            'success' => true,
            'message' => 'Logged out from all devices.',
        ]);
    });

    // Update authenticated user profile
    Route::post('/user/profile', function (Request $request) {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:25|unique:users,phone,' . $user->id,
            'roll_no' => 'nullable|string|max:50|unique:users,roll_no,' . $user->id,
            'department' => 'nullable|string|max:150',
            'branch' => 'nullable|string|max:150',
            'course' => 'nullable|string|max:150',
            'semester' => 'nullable|string|max:50',
            'college' => 'nullable|string|max:200',
            'university' => 'nullable|string|max:200',
            'bio' => 'nullable|string|max:1000',
            'avatar' => 'nullable|string',
            'linkedin' => 'nullable|string|max:500',
            'github' => 'nullable|string|max:500',
        ]);

        // Check if student profile has all key enrollment details completed
        $isComplete = !empty($validated['phone'])
            && !empty($validated['roll_no'])
            && !empty($validated['college'])
            && !empty($validated['department'])
            && !empty($validated['course']);

        // Automatically synchronize normalized foreign keys with app_settings
        $academicMap = [
            'college' => 'college_id',
            'course' => 'course_id',
            'branch' => 'branch_id',
            'semester' => 'semester_id',
            'department' => 'department_id',
            'university' => 'university_id',
        ];
        foreach ($academicMap as $field => $fk) {
            if (!empty($validated[$field])) {
                $val = trim($validated[$field]);
                $validated[$fk] = \App\Models\AppSetting::where('type', $field)
                    ->where(function ($q) use ($val) {
                        $q->where('name', $val)
                          ->orWhereRaw('LOWER(name) = ?', [strtolower($val)]);
                    })->value('id');
            }
        }

        $validated['profile_completed'] = $isComplete;
        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh(),
        ]);
    });

    // Update authenticated user password directly (New & Confirm password)
    Route::post('/user/change-password', function (Request $request) {
        $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();
        $user->password = \Illuminate\Support\Facades\Hash::make($request->input('password'));
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.',
        ]);
    });

    // Student / User Personal Dashboard Data Endpoints
    Route::get('/user/dashboard-summary', function (Request $request) {
        $user = $request->user();

        // Registered / Attended events count and list
        $eventRegistrations = \App\Models\EventRegistration::where('user_id', $user->id)
            ->orWhere('user_email', $user->email)
            ->orderBy('id', 'desc')
            ->get();

        $eventIds = $eventRegistrations->pluck('event_id')->unique()->toArray();
        $events = \App\Models\Event::whereIn('id', $eventIds)->get()->keyBy('id');

        $userEvents = $eventRegistrations->map(function ($reg) use ($events) {
            $ev = $events->get($reg->event_id);
            return [
                'registration_id' => $reg->id,
                'event_id' => $reg->event_id,
                'event_code' => $ev ? $ev->code : 'CZ-EVENT',
                'event_title' => $ev ? $ev->title : 'Codezen Event',
                'event_type' => $ev ? $ev->type : 'Workshop',
                'mode' => $ev ? $ev->mode : 'Offline',
                'venue' => $ev ? $ev->venue : 'TBA',
                'start_date' => $ev ? $ev->start_date : null,
                'status' => $ev ? $ev->status : 'CONFIRMED',
                'registration_status' => $reg->status,
                'attendance_status' => $reg->attendance_status ?? 'Absent',
                'attended_at' => $reg->attended_at ? $reg->attended_at->format('M d, Y h:i A') : null,
                'qr_token' => $reg->qr_token,
                'registered_at' => $reg->created_at ? $reg->created_at->format('M d, Y') : null,
            ];
        });

        // Store Orders / Purchases history
        $orders = \App\Models\StoreOrder::where('user_id', $user->id)
            ->orWhere('buyer_email', $user->email)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'stats' => [
                'events_attended' => $userEvents->filter(fn($e) => $e['attendance_status'] === 'Present' || $e['registration_status'] === 'Attended')->count(),
                'events_registered' => $userEvents->count(),
                'orders_count' => $orders->count(),
                'total_spent' => $orders->sum('total_amount'),
            ],
            'events' => $userEvents,
            'orders' => $orders,
        ]);
    });

    // Admin & Lead hierarchy user management
    Route::prefix('admin')->group(function () {
        Route::get('/teams', [AdminController::class, 'getTeams']);

        // Lightweight overview metrics (counts only to minimize server load)
        Route::get('/overview-stats', function () {
            $eventsCount = \App\Models\Event::count();
            $activeEventsCount = \App\Models\Event::whereIn('status', ['REGISTRATION OPEN', 'LIVE NOW'])->count();
            $teamCount = \App\Models\User::whereIn('role', ['Team', 'Admin'])->count();
            $communityCount = \App\Models\User::where('role', 'User')->count();
            $pendingAppsCount = \App\Models\Application::where('status', 'Pending')->count();
            $productsCount = \App\Models\StoreProduct::count();
            $settingsCount = \App\Models\AppSetting::count();
            $recentApplications = \App\Models\Application::orderBy('id', 'desc')->take(4)->get();

            return response()->json([
                'success' => true,
                'stats' => [
                    'events_count' => $eventsCount,
                    'active_events_count' => $activeEventsCount,
                    'team_members_count' => $teamCount,
                    'community_users_count' => $communityCount,
                    'pending_applications_count' => $pendingAppsCount,
                    'products_count' => $productsCount,
                    'settings_count' => $settingsCount,
                    'recent_applications' => $recentApplications,
                ],
            ]);
        });

        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/users/{id}/details', [AdminController::class, 'getUserDetails']);
        Route::post('/users/{id}', [AdminController::class, 'updateUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::post('/users/{id}/remove-member', [AdminController::class, 'removeMember']);

        // Events Management
        Route::get('/events', [AdminController::class, 'getEvents']);
        Route::post('/events', [AdminController::class, 'saveEvent']);
        Route::delete('/events/{id}', [AdminController::class, 'deleteEvent']);
        Route::get('/events/{id}/registrations', [AdminController::class, 'getEventRegistrations']);
        Route::get('/events/{id}/registrations/export', [AdminController::class, 'exportEventRegistrations']);
        Route::delete('/events/registrations/{id}', [AdminController::class, 'deleteRegistration']);
        Route::post('/events/attendance', [AdminController::class, 'markAttendance']);
        Route::post('/events/{id}/bulk-attendance', [AdminController::class, 'bulkMarkAttendance']);

        // Store Products Management
        Route::get('/products', [AdminController::class, 'getProducts']);
        Route::post('/products', [AdminController::class, 'saveProduct']);
        Route::delete('/products/{id}', [AdminController::class, 'deleteProduct']);

        // Membership Applications & Promotion
        Route::get('/applications', [AdminController::class, 'getApplications']);
        Route::post('/applications/{id}/promote', [AdminController::class, 'promoteApplication']);
        Route::post('/applications/{id}/reject', [AdminController::class, 'rejectApplication']);

        // Dynamic Settings & Taxonomy Management
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::post('/settings', [AdminController::class, 'saveSetting']);
        Route::post('/settings/reorder', [AdminController::class, 'reorderSettings']);
        Route::post('/members/reorder', [AdminController::class, 'reorderMembers']);
        Route::delete('/settings/{id}', [AdminController::class, 'deleteSetting']);

        // Roles & Permissions (RBAC)
        Route::get('/rbac/permissions', [AdminController::class, 'getRolePermissions']);
        Route::post('/rbac/permissions', [AdminController::class, 'saveRolePermissions']);
    });
});
