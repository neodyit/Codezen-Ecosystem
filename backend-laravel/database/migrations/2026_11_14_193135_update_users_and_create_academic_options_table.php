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
        // 1. Add course, semester, university to users table if they don't exist
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'course')) {
                $table->string('course', 100)->nullable()->after('branch');
            }
            if (!Schema::hasColumn('users', 'semester')) {
                $table->string('semester', 20)->nullable()->after('course');
            }
            if (!Schema::hasColumn('users', 'university')) {
                $table->string('university', 200)->nullable()->after('college');
            }
        });

        // 2. Create academic_options table to store selectable values dynamically
        if (!Schema::hasTable('academic_options')) {
            Schema::create('academic_options', function (Blueprint $table) {
                $table->id();
                $table->string('category', 50)->index(); // 'department', 'branch', 'course', 'semester', 'college', 'university'
                $table->string('value', 200);
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_options');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['course', 'semester', 'university']);
        });
    }
};
