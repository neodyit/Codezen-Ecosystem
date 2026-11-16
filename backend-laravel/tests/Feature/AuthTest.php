<?php

namespace Tests\Feature;

use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;
    public function test_check_email_for_existing_user(): void
    {
        User::create([
            'name' => 'Neody',
            'email' => 'neodyinfotech@gmail.com',
            'password_hash' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/check-email', [
            'email' => 'neodyinfotech@gmail.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'exists' => true,
                'hasPassword' => true,
            ]);
    }

    public function test_check_email_for_non_existent_user(): void
    {
        $response = $this->postJson('/api/auth/check-email', [
            'email' => 'nonexistent_test_builder@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'exists' => false,
            ]);
    }

    public function test_send_and_verify_otp(): void
    {
        $testEmail = 'tester_' . uniqid() . '@example.com';

        // 1. Send OTP
        $sendResponse = $this->postJson('/api/auth/send-otp', [
            'email' => $testEmail,
        ]);

        $sendResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $otpRecord = OtpVerification::where('email', $testEmail)->first();
        $this->assertNotNull($otpRecord);

        // 2. Verify OTP
        $verifyResponse = $this->postJson('/api/auth/verify-otp', [
            'email' => $testEmail,
            'otp' => $otpRecord->otp_code,
        ]);

        $verifyResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'token',
                'user' => ['id', 'email', 'name'],
            ]);
    }

    public function test_login_with_valid_password(): void
    {
        $testEmail = 'login_test_' . uniqid() . '@example.com';
        User::create([
            'name' => 'Login Tester',
            'email' => $testEmail,
            'password_hash' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $testEmail,
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_google_auth(): void
    {
        $googleEmail = 'google_' . uniqid() . '@example.com';

        $response = $this->postJson('/api/auth/google-auth', [
            'email' => $googleEmail,
            'name' => 'Google User',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'isNewUser' => true,
            ])
            ->assertJsonStructure(['token', 'user']);
    }
}
