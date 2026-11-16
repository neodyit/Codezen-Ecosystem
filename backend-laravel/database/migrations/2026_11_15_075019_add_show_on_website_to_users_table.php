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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'show_on_website')) {
                $table->boolean('show_on_website')->default(false)->after('tag');
            }
            if (!Schema::hasColumn('users', 'website_order')) {
                $table->integer('website_order')->default(99)->after('show_on_website');
            }
            if (!Schema::hasColumn('users', 'linkedin')) {
                $table->string('linkedin', 255)->nullable()->after('avatar');
            }
            if (!Schema::hasColumn('users', 'github')) {
                $table->string('github', 255)->nullable()->after('linkedin');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['show_on_website', 'website_order', 'linkedin', 'github']);
        });
    }
};
