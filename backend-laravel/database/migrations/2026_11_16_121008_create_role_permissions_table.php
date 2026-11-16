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
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role_name', 50); // e.g., 'Admin', 'Lead', 'Member', 'User', or custom dynamic roles
            $table->string('permission_key', 100); // e.g., 'events.create', 'events.edit', etc.
            $table->string('module', 50)->default('general'); // e.g., 'events', 'users', 'scanner', etc.
            $table->timestamps();

            $table->unique(['role_name', 'permission_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};
