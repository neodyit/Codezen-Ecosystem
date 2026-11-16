<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicOption;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class AcademicController extends Controller
{
    /**
     * Retrieve all selectable academic options grouped by category.
     * Checks both app_settings (configured via Admin Settings) and academic_options table.
     */
    public function getOptions(Request $request)
    {
        $grouped = [
            'universities' => [],
            'colleges' => [],
            'departments' => [],
            'courses' => [],
            'branches' => [],
            'semesters' => [],
        ];

        // 1. Fetch from dynamic app_settings (configured via Admin Panel)
        $settings = AppSetting::where('is_active', true)
            ->whereIn('type', ['university', 'college', 'department', 'course', 'branch', 'semester'])
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        foreach ($settings as $s) {
            $key = match (strtolower($s->type)) {
                'university' => 'universities',
                'college' => 'colleges',
                'department' => 'departments',
                'course' => 'courses',
                'branch' => 'branches',
                'semester' => 'semesters',
                default => null,
            };
            if ($key && !in_array($s->name, $grouped[$key])) {
                $grouped[$key][] = $s->name;
            }
        }

        // 2. Fetch from academic_options table if present
        $options = AcademicOption::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('value', 'asc')
            ->get();

        foreach ($options as $opt) {
            $cat = strtolower($opt->category);
            $key = match ($cat) {
                'university' => 'universities',
                'college' => 'colleges',
                'department' => 'departments',
                'course' => 'courses',
                'branch' => 'branches',
                'semester' => 'semesters',
                default => null,
            };

            if ($key && !in_array($opt->value, $grouped[$key])) {
                $grouped[$key][] = $opt->value;
            }
        }

        // 3. Fallback defaults if no custom academic settings have been configured in DB yet
        $defaultUniversities = [
            'IKGPTU (I.K. Gujral Punjab Technical University)',
            'Chandigarh University',
            'Panjab University (PU)',
            'Chitkara University',
        ];
        $defaultColleges = [
            'CEC - Chandigarh Engineering College, Landran',
            'CGC - Chandigarh Group of Colleges, Jhanjeri',
            'CCE - Chandigarh College of Education',
            'CCH - Chandigarh College of Hospitality',
            'CCBM - Chandigarh College of Business Management',
        ];
        $defaultCourses = [
            'B.Tech (Bachelor of Technology)',
            'BCA (Bachelor of Computer Applications)',
            'MCA (Master of Computer Applications)',
            'B.Sc Computer Science / IT',
            'M.Tech',
            'BBA',
            'MBA',
        ];
        $defaultDepartments = [
            'Computer Science & Engineering',
            'Information Technology',
            'Artificial Intelligence & Data Science',
            'Electronics & Communication Engineering',
            'Mechanical Engineering',
            'Applied Sciences',
            'Computer Applications',
        ];
        $defaultBranches = [
            'Computer Science & Engineering (Core)',
            'CSE - AI & Machine Learning',
            'CSE - Data Science',
            'CSE - Cyber Security',
            'Information Technology (IT)',
            'General',
        ];
        $defaultSemesters = [
            '1st Semester',
            '2nd Semester',
            '3rd Semester',
            '4th Semester',
            '5th Semester',
            '6th Semester',
            '7th Semester',
            '8th Semester',
        ];

        if (empty($grouped['universities'])) $grouped['universities'] = $defaultUniversities;
        if (empty($grouped['colleges'])) $grouped['colleges'] = $defaultColleges;
        if (empty($grouped['courses'])) $grouped['courses'] = $defaultCourses;
        if (empty($grouped['departments'])) $grouped['departments'] = $defaultDepartments;
        if (empty($grouped['branches'])) $grouped['branches'] = $defaultBranches;
        if (empty($grouped['semesters'])) $grouped['semesters'] = $defaultSemesters;

        return response()->json([
            'success' => true,
            'data' => $grouped,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
