<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Events Table
        if (!Schema::hasTable('events')) {
            Schema::create('events', function (Blueprint $table) {
                $table->increments('id');
                $table->string('code', 50)->unique(); // e.g. "CZ-HACK-01"
                $table->string('title', 200);
                $table->string('tagline', 255)->nullable();
                $table->text('description')->nullable();
                $table->enum('type', ['Hackathon', 'Bootcamp', 'Workshop', 'Challenge', 'Contest', 'Code Race'])->default('Workshop');
                $table->enum('mode', ['Offline', 'Online', 'Hybrid'])->default('Offline');
                $table->enum('participation', ['Single', 'Team', 'Single or Team'])->default('Single');
                $table->string('team_size', 50)->nullable(); // e.g. "2 - 4 Members"
                $table->enum('status', ['REGISTRATION OPEN', 'UPCOMING', 'LIVE NOW', 'CONCLUDED'])->default('UPCOMING');
                $table->string('start_date', 50)->nullable();
                $table->string('end_date', 50)->nullable();
                $table->string('time', 100)->nullable();
                $table->string('duration', 50)->nullable();
                $table->string('venue', 200)->nullable();
                $table->string('location_details', 255)->nullable();
                $table->string('seats', 50)->nullable();
                $table->string('prize_pool', 100)->nullable();
                $table->json('perks')->nullable();
                $table->json('tags')->nullable();
                $table->json('speakers')->nullable();
                $table->string('banner_img', 255)->nullable();
                $table->string('registration_url', 255)->nullable();
                $table->integer('created_by')->nullable();
                $table->timestamps();
            });
        }

        // 2. Event Registrations Table
        if (!Schema::hasTable('event_registrations')) {
            Schema::create('event_registrations', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('event_id')->unsigned();
                $table->integer('user_id')->nullable();
                $table->string('user_name', 100);
                $table->string('user_email', 150);
                $table->string('user_phone', 25)->nullable();
                $table->string('roll_no', 50)->nullable();
                $table->string('college', 200)->nullable();
                $table->string('team_name', 100)->nullable();
                $table->json('team_members')->nullable();
                $table->enum('status', ['Confirmed', 'Pending', 'Waitlisted', 'Cancelled'])->default('Confirmed');
                $table->timestamps();
            });
        }

        // 3. Store Products Table
        if (!Schema::hasTable('store_products')) {
            Schema::create('store_products', function (Blueprint $table) {
                $table->increments('id');
                $table->string('sku', 50)->unique();
                $table->string('name', 200);
                $table->string('category', 100)->default('Apparel'); // Apparel, Swag, Tech, Stickers
                $table->decimal('price', 10, 2)->default(0.00);
                $table->decimal('original_price', 10, 2)->nullable();
                $table->integer('stock')->default(0);
                $table->enum('status', ['Active', 'Draft', 'Out of Stock'])->default('Active');
                $table->text('description')->nullable();
                $table->json('sizes')->nullable(); // e.g. ["S", "M", "L", "XL"]
                $table->string('image_url', 255)->nullable();
                $table->timestamps();
            });
        }

        // 4. Membership Applications Table
        if (!Schema::hasTable('applications')) {
            Schema::create('applications', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('user_id')->nullable();
                $table->string('name', 100);
                $table->string('email', 150);
                $table->string('phone', 25)->nullable();
                $table->string('roll_no', 50)->nullable();
                $table->string('department', 150)->nullable();
                $table->string('course', 150)->nullable();
                $table->string('semester', 50)->nullable();
                $table->string('target_team', 100); // e.g. "Technical", "Management"
                $table->string('target_position', 100)->default('Member');
                $table->text('portfolio_url')->nullable();
                $table->text('github_url')->nullable();
                $table->text('statement_of_purpose')->nullable();
                $table->enum('status', ['Pending', 'Shortlisted', 'Approved', 'Rejected'])->default('Pending');
                $table->text('reviewer_notes')->nullable();
                $table->integer('reviewed_by')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('applications');
        Schema::dropIfExists('store_products');
        Schema::dropIfExists('event_registrations');
        Schema::dropIfExists('events');
    }
};
