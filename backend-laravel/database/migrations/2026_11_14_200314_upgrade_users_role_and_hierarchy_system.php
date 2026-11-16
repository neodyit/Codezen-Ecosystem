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
        Schema::table('users', function (Blueprint $table) {
            // Change role from INT to VARCHAR for clarity: 'Admin', 'Team', 'User'
            $table->string('role', 50)->default('User')->change();

            // Add user 'type': 'Admin', 'Lead', 'Member', 'User'
            if (!Schema::hasColumn('users', 'type')) {
                $table->string('type', 50)->default('User')->after('role');
            }

            // Position for Leads: 'President', 'Vice President', 'Head', 'Co-Head', 'General Secretary', 'Joint Secretary', 'Treasurer', etc.
            if (!Schema::hasColumn('users', 'position')) {
                $table->string('position', 100)->nullable()->after('team');
            }

            // Bio or status tag
            if (!Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable()->after('tag');
            }

            // Avatar photo path or URL
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar', 255)->nullable()->after('bio');
            }
        });

        // Set Mayank Tiwari (neodyinfotech@gmail.com) as President & Admin
        DB::table('users')->where('email', 'neodyinfotech@gmail.com')->update([
            'role' => 'Admin',
            'type' => 'Admin',
            'team' => 'Executive Board',
            'position' => 'President',
            'tag' => 'Founder & President',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['type', 'position', 'bio', 'avatar']);
        });
    }
};
