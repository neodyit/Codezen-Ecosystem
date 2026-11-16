<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('college_id')->nullable()->after('college');
            $table->unsignedInteger('course_id')->nullable()->after('course');
            $table->unsignedInteger('branch_id')->nullable()->after('branch');
            $table->unsignedInteger('semester_id')->nullable()->after('semester');
            $table->unsignedInteger('department_id')->nullable()->after('department');
            $table->unsignedInteger('university_id')->nullable()->after('university');

            $table->foreign('college_id')->references('id')->on('app_settings')->nullOnDelete();
            $table->foreign('course_id')->references('id')->on('app_settings')->nullOnDelete();
            $table->foreign('branch_id')->references('id')->on('app_settings')->nullOnDelete();
            $table->foreign('semester_id')->references('id')->on('app_settings')->nullOnDelete();
            $table->foreign('department_id')->references('id')->on('app_settings')->nullOnDelete();
            $table->foreign('university_id')->references('id')->on('app_settings')->nullOnDelete();
        });

        // Auto-match and backfill existing text values with their corresponding app_settings.id
        $taxonomies = [
            'college' => 'college_id',
            'course' => 'course_id',
            'branch' => 'branch_id',
            'semester' => 'semester_id',
            'department' => 'department_id',
            'university' => 'university_id',
        ];

        foreach ($taxonomies as $column => $fkColumn) {
            $settings = DB::table('app_settings')
                ->where('type', $column)
                ->get(['id', 'name']);

            foreach ($settings as $setting) {
                DB::table('users')
                    ->whereNull($fkColumn)
                    ->where(function ($query) use ($column, $setting) {
                        $query->where($column, $setting->name)
                              ->orWhereRaw("LOWER($column) = ?", [strtolower(trim($setting->name))]);
                    })
                    ->update([$fkColumn => $setting->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['college_id']);
            $table->dropForeign(['course_id']);
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['semester_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['university_id']);

            $table->dropColumn([
                'college_id',
                'course_id',
                'branch_id',
                'semester_id',
                'department_id',
                'university_id',
            ]);
        });
    }
};
