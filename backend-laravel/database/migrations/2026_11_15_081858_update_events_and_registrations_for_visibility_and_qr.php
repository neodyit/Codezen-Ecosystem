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
        Schema::table('events', function (Blueprint $table) {
            if (!Schema::hasColumn('events', 'visibility')) {
                $table->enum('visibility', ['Public', 'Private'])->default('Public')->after('status');
            }
            if (!Schema::hasColumn('events', 'registration_open')) {
                $table->boolean('registration_open')->default(true)->after('visibility');
            }
        });

        Schema::table('event_registrations', function (Blueprint $table) {
            if (!Schema::hasColumn('event_registrations', 'qr_token')) {
                $table->string('qr_token', 64)->nullable()->unique()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['visibility', 'registration_open']);
        });

        Schema::table('event_registrations', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }
};
