<?php

namespace Database\Seeders;

use App\Models\AppSetting;
use Illuminate\Database\Seeder;

class AppSettingsSeeder extends Seeder
{
    public function run(): void
    {
        if (AppSetting::count() === 0) {
            // 1. Roles
            $roles = ['Admin', 'Team', 'User'];
            foreach ($roles as $i => $r) {
                AppSetting::create(['type' => 'role', 'name' => $r, 'sort_order' => $i + 1]);
            }

            // 2. Types
            $types = ['Admin', 'Lead', 'Member', 'User'];
            foreach ($types as $i => $t) {
                AppSetting::create(['type' => 'type', 'name' => $t, 'sort_order' => $i + 1]);
            }

            // 3. Teams
            $teams = ['Executive Board', 'Technical', 'Management', 'Marketing', 'Creatives', 'Human Resources (HR)'];
            foreach ($teams as $i => $tm) {
                AppSetting::create(['type' => 'team', 'name' => $tm, 'sort_order' => $i + 1]);
            }

            // 4. Positions
            $positions = [
                ['name' => 'President', 'group' => 'Executive Board'],
                ['name' => 'Vice President', 'group' => 'Executive Board'],
                ['name' => 'Technical Head', 'group' => 'Technical'],
                ['name' => 'Technical Co-Head', 'group' => 'Technical'],
                ['name' => 'Management Head', 'group' => 'Management'],
                ['name' => 'Marketing Head', 'group' => 'Marketing'],
                ['name' => 'Creatives Head', 'group' => 'Creatives'],
                ['name' => 'HR Lead', 'group' => 'Human Resources (HR)'],
                ['name' => 'Full-Stack Developer', 'group' => 'Technical'],
                ['name' => 'DevOps Engineer', 'group' => 'Technical'],
                ['name' => 'Event Coordinator', 'group' => 'Management'],
                ['name' => 'UI/UX Designer', 'group' => 'Creatives'],
                ['name' => 'Content Writer', 'group' => 'Marketing'],
                ['name' => 'Core Member', 'group' => 'Technical'],
            ];
            foreach ($positions as $i => $pos) {
                AppSetting::create([
                    'type' => 'position',
                    'name' => $pos['name'],
                    'group' => $pos['group'],
                    'sort_order' => $i + 1,
                ]);
            }
        }
    }
}

