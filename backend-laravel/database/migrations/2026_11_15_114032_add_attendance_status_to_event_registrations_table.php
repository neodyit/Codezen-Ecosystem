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
        Schema::table('event_registrations', function (Blueprint $table) {
            if (!Schema::hasColumn('event_registrations', 'attendance_status')) {
                $table->string('attendance_status', 30)->default('Absent')->after('status');
            }
            if (!Schema::hasColumn('event_registrations', 'attended_at')) {
                $table->timestamp('attended_at')->nullable()->after('attendance_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_registrations', function (Blueprint $table) {
            if (Schema::hasColumn('event_registrations', 'attendance_status')) {
                $table->dropColumn('attendance_status');
            }
            if (Schema::hasColumn('event_registrations', 'attended_at')) {
                $table->dropColumn('attended_at');
            }
        });
    }
};
