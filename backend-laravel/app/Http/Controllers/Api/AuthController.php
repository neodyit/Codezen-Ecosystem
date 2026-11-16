<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\OtpVerification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Check if user exists and whether a password has been set.
     */
    public function checkEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = trim($request->input('email'));
        $user = User::where('email', $email)->first();

        if ($user) {
            $hasPassword = !empty($user->password);
            return response()->json([
                'exists' => true,
                'hasPassword' => $hasPassword,
            ]);
        }

        return response()->json([
            'exists' => false,
        ]);
    }

    /**
     * Direct multi-stage registration with personal & academic details.
     */
    public function registerDirect(Request $request)
    {
        $validated = $request->validate([
            // Personal Details
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email',
            'phone' => 'required|string|max:25|unique:users,phone',
            'password' => 'required|string|min:6',

            // Academic Details
            'roll_no' => 'required|string|max:50|unique:users,roll_no',
            'department' => 'required|string|max:150',
            'branch' => 'required|string|max:150',
            'course' => 'required|string|max:150',
            'semester' => 'required|string|max:50',
            'college' => 'required|string|max:200',
            'university' => 'required|string|max:200',
        ]);

        $email = trim($validated['email']);
        $name = trim($validated['name']);
        $password = $validated['password'];

        $hashed = Hash::make($password);
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $hashed,
            'phone' => $validated['phone'],
            'roll_no' => $validated['roll_no'],
            'department' => $validated['department'],
            'branch' => $validated['branch'],
            'course' => $validated['course'],
            'semester' => $validated['semester'],
            'college' => $validated['college'],
            'university' => $validated['university'],
            'profile_completed' => true,
            'role' => 'User',
            'type' => 'User',
            'team' => null,
            'position' => null,
            'tag' => 'Community Attendee',
        ]);

        $token = $user->createToken('codezen-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
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
                'profile_completed' => true,
                'role' => $user->role,
                'type' => $user->type,
                'team' => $user->team,
                'position' => $user->position,
                'tag' => $user->tag,
                'is_admin' => $user->isExecutive(),
                'is_lead' => $user->isLead(),
            ],
        ]);
    }

    /**
     * Send OTP to user's email.
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = trim($request->input('email'));
        $otp = sprintf("%06d", mt_rand(1, 999999));

        // Invalidate old OTPs for this email
        OtpVerification::where('email', $email)->delete();

        // Create new OTP valid for 10 minutes
        OtpVerification::create([
            'email' => $email,
            'otp_code' => $otp,
            'expires_at' => Carbon::now()->addMinutes(10),
        ]);

        // Attempt sending email via Laravel Mail or log fallback
        try {
            Mail::raw("Your CodeZen verification code is: {$otp}\nThis code will expire in 10 minutes.", function ($message) use ($email) {
                $message->to($email)->subject('Your CodeZen Verification Code');
            });
        } catch (\Throwable $e) {
            Log::warning("Could not send email to {$email}: " . $e->getMessage());
        }

        // Also write to otp_logs.txt for instant local testing/verification
        $logPath = storage_path('logs/otp_logs.txt');
        $timestamp = date("Y-m-d H:i:s");
        @file_put_contents($logPath, "[{$timestamp}] To: {$email} | OTP: {$otp}\n", FILE_APPEND);

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully',
            'debug_otp' => config('app.debug') ? $otp : null,
        ]);
    }

    /**
     * Verify OTP code and log in or register user.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string',
        ]);

        $email = trim($request->input('email'));
        $otp = trim($request->input('otp'));

        $record = OtpVerification::where('email', $email)
            ->where('otp_code', $otp)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$record) {
            return response()->json([
                'error' => 'Invalid or expired OTP',
            ], 400);
        }

        // Invalidate used OTP
        OtpVerification::where('email', $email)->delete();

        // Check if user already exists
        $user = User::where('email', $email)->first();
        $isNewUser = false;

        if (!$user) {
            $isNewUser = true;
            $name = explode('@', $email)[0];
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'role' => 1,
            ]);
        }

        $token = $user->createToken('codezen-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => $isNewUser ? 'OTP verified. New account created.' : 'OTP verified successfully.',
            'isNewUser' => $isNewUser,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'type' => $user->type,
                'team' => $user->team,
                'position' => $user->position,
                'tag' => $user->tag,
                'is_admin' => $user->isExecutive(),
                'is_lead' => $user->isLead(),
            ],
        ]);
    }

    /**
     * Standard email + password login.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $email = trim($request->input('email'));
        $password = $request->input('password');

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'error' => 'User not found',
            ], 404);
        }

        // Check against standard password field
        if (!$user->password || !Hash::check($password, $user->password)) {
            return response()->json([
                'error' => 'Invalid credentials',
            ], 401);
        }

        $token = $user->createToken('codezen-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'type' => $user->type,
                'team' => $user->team,
                'position' => $user->position,
                'tag' => $user->tag,
                'is_admin' => $user->isExecutive(),
                'is_lead' => $user->isLead(),
            ],
        ]);
    }

    /**
     * Set / update password for user.
     */
    public function setPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $email = trim($request->input('email'));
        $password = $request->input('password');

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'error' => 'User not found',
            ], 404);
        }

        $hashed = Hash::make($password);
        $user->password = $hashed;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password set successfully',
        ]);
    }

    /**
     * Google Single Sign-On handler.
     */
    public function googleAuth(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required|string',
            'google_id' => 'nullable|string',
            'google_token' => 'nullable|string',
            'avatar' => 'nullable|string',
        ]);

        $email = trim($request->input('email'));
        $name = trim($request->input('name'));
        $googleId = $request->input('google_id');
        $googleToken = $request->input('google_token');
        $avatar = $request->input('avatar');

        $user = User::where('email', $email)->first();
        $isNewUser = false;

        if (!$user) {
            $isNewUser = true;
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'google_id' => $googleId,
                'google_token' => $googleToken,
                'avatar' => $avatar,
                'profile_completed' => false,
                'role' => 'User',
                'type' => 'User',
                'team' => null,
                'position' => null,
                'tag' => 'Community Attendee',
            ]);
        } else {
            // Update Google tokens or avatar if provided
            $updates = [];
            if ($googleId && !$user->google_id) $updates['google_id'] = $googleId;
            if ($googleToken) $updates['google_token'] = $googleToken;
            if ($avatar && !$user->avatar) $updates['avatar'] = $avatar;
            if (!empty($updates)) {
                $user->update($updates);
            }
        }

        $token = $user->createToken('codezen-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => $isNewUser ? 'Registration successful' : 'Login successful',
            'isNewUser' => $isNewUser,
            'requiresProfileCompletion' => !$user->profile_completed,
            'token' => $token,
            'user' => [
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
                'avatar' => $user->avatar,
                'profile_completed' => (bool)$user->profile_completed,
                'role' => $user->role,
                'type' => $user->type,
                'team' => $user->team,
                'position' => $user->position,
                'tag' => $user->tag,
                'is_admin' => $user->isExecutive(),
                'is_lead' => $user->isLead(),
            ],
        ]);
    }

    /**
     * Send password reset link to user's email with token expiry.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = trim($request->input('email'));
        $user = User::where('email', $email)->first();

        if (!$user) {
            // For security, do not leak whether account exists or not
            return response()->json([
                'success' => true,
                'message' => 'If an account exists with this email, a reset link has been dispatched.',
            ]);
        }

        // Generate secure 64-character token
        $rawToken = Str::random(64);
        $hashedToken = Hash::make($rawToken);

        // Remove old reset tokens for this email
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Save new token
        DB::table('password_reset_tokens')->insert([
            'email' => $email,
            'token' => $hashedToken,
            'created_at' => Carbon::now(),
        ]);

        // Construct frontend reset link
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $resetUrl = rtrim($frontendUrl, '/') . '/reset-password?token=' . urlencode($rawToken) . '&email=' . urlencode($email);

        // Attempt dispatching email via SMTP mailer
        try {
            Mail::to($email)->send(new PasswordResetMail($resetUrl, $user->name ?: 'Member'));
        } catch (\Throwable $e) {
            Log::warning("Could not dispatch SMTP reset email to {$email}: " . $e->getMessage());
        }

        // Log the link in storage/logs/reset_links.txt for local verification
        $logFile = storage_path('logs/reset_links.txt');
        $timestamp = date("Y-m-d H:i:s");
        @file_put_contents($logFile, "[{$timestamp}] To: {$email} | Reset Link: {$resetUrl}\n", FILE_APPEND);

        return response()->json([
            'success' => true,
            'message' => 'A password reset link has been sent to your email address.',
            'debug_link' => config('app.debug') ? $resetUrl : null,
        ]);
    }

    /**
     * Reset password using expiry-based token.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $email = trim($request->input('email'));
        $rawToken = $request->input('token');
        $password = $request->input('password');

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (!$record) {
            return response()->json([
                'error' => 'Invalid or expired password reset link.',
            ], 400);
        }

        // Check 60-minute expiry
        $createdAt = Carbon::parse($record->created_at);
        if ($createdAt->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'error' => 'This password reset link has expired. Please request a new one.',
            ], 400);
        }

        // Verify token match
        if (!Hash::check($rawToken, $record->token)) {
            return response()->json([
                'error' => 'Invalid password reset token.',
            ], 400);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json([
                'error' => 'User not found.',
            ], 404);
        }

        $newHash = Hash::make($password);
        $user->password = $newHash;
        $user->save();

        // Delete used token
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Issue new session token
        $token = $user->createToken('codezen-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Password reset successful! You can now log in.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }
}
