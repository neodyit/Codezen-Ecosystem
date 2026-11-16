<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Normalized Teams Registry Table
        if (!Schema::hasTable('teams')) {
            Schema::create('teams', function (Blueprint $table) {
                $table->increments('id');
                $table->string('name', 100)->unique();
                $table->string('slug', 100)->unique();
                $table->string('description', 255)->nullable();
                $table->string('icon', 50)->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });

            // Seed initial official domains
            $defaultTeams = [
                ['name' => 'Executive Board', 'slug' => 'executive-board', 'description' => 'Presidential Leadership, Advisory & Overall Strategy', 'sort_order' => 1],
                ['name' => 'Technical', 'slug' => 'technical', 'description' => 'Full-Stack, Cloud, AI/ML, DevOps & Sprints', 'sort_order' => 2],
                ['name' => 'Management', 'slug' => 'management', 'description' => 'Operations, Event Execution & Logistics', 'sort_order' => 3],
                ['name' => 'Marketing', 'slug' => 'marketing', 'description' => 'Public Relations, Social Media & Community Growth', 'sort_order' => 4],
                ['name' => 'Creatives', 'slug' => 'creatives', 'description' => 'UI/UX Design, 3D Graphics & Media Production', 'sort_order' => 5],
                ['name' => 'Human Resources (HR)', 'slug' => 'hr', 'description' => 'Internal Affairs, Talent Acquisition & Records', 'sort_order' => 6],
            ];

            foreach ($defaultTeams as $t) {
                DB::table('teams')->insert(array_merge($t, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }

        // 2. Team Memberships Table (Supports dual-roles / multiple teams)
        if (!Schema::hasTable('team_memberships')) {
            Schema::create('team_memberships', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('user_id');
                $table->unsignedInteger('team_id');
                $table->string('designation', 100)->default('Member'); // 'Lead', 'Co-Head', 'Core Member', 'Member'
                $table->string('position', 100)->nullable(); // 'President', 'Head', 'General Secretary', etc.
                $table->boolean('is_primary')->default(true);
                $table->timestamp('joined_at')->useCurrent();
                $table->timestamps();

                $table->unique(['user_id', 'team_id']);
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            });
        }

        // 3. Audit Logs Table (Tracks who promoted/assigned whom for governance)
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('actor_id')->nullable();
                $table->integer('target_id')->nullable();
                $table->string('action', 100);
                $table->text('details')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();

                $table->foreign('actor_id')->references('id')->on('users')->onDelete('set null');
                $table->foreign('target_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        // 4. Ensure Mayank Tiwari (neodyinfotech@gmail.com) has Executive Board membership
        $mayank = DB::table('users')->where('email', 'neodyinfotech@gmail.com')->first();
        $execTeam = DB::table('teams')->where('slug', 'executive-board')->first();

        if ($mayank && $execTeam) {
            DB::table('team_memberships')->updateOrInsert(
                ['user_id' => $mayank->id, 'team_id' => $execTeam->id],
                [
                    'designation' => 'Lead',
                    'position' => 'President',
                    'is_primary' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('team_memberships');
        Schema::dropIfExists('teams');
    }
};
