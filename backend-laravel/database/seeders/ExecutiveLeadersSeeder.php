<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ExecutiveLeadersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. President (Order 1)
        $president = User::where('email', 'neodyinfotech@gmail.com')->first();
        if ($president) {
            $president->update([
                'position' => 'President',
                'role' => 'Admin',
                'type' => 'Lead',
                'team' => 'Executive Board',
                'show_on_website' => true,
                'website_order' => 1,
                'avatar' => '/leader-president.jpg',
                'github' => 'https://github.com/neodyit',
                'linkedin' => 'https://linkedin.com',
            ]);
        }

        // 2. Vice President (Order 2)
        $vp = User::where('position', 'Vice President')->orWhere('email', 'vp@codezen.neodyit.in')->first();
        if (!$vp) {
            User::create([
                'name' => 'Vice President',
                'email' => 'vp@codezen.neodyit.in',
                'password' => Hash::make('CodeZen@2026'),
                'role' => 'Admin',
                'type' => 'Lead',
                'team' => 'Executive Board',
                'position' => 'Vice President',
                'tag' => 'Executive Leadership',
                'show_on_website' => true,
                'website_order' => 2,
                'avatar' => '/leader-vp.jpg',
                'linkedin' => '#',
            ]);
        } else {
            $vp->update([
                'show_on_website' => true,
                'website_order' => 2,
                'position' => 'Vice President',
                'team' => 'Executive Board',
            ]);
        }

        // 3. Faculty Coordinator (Order 3)
        $fc = User::where('position', 'Faculty Coordinator')->orWhere('email', 'faculty@cgc.edu.in')->first();
        if (!$fc) {
            User::create([
                'name' => 'Faculty Coordinator',
                'email' => 'faculty@cgc.edu.in',
                'password' => Hash::make('CodeZen@2026'),
                'role' => 'Admin',
                'type' => 'Lead',
                'team' => 'Executive Board',
                'position' => 'Faculty Coordinator',
                'tag' => 'Academic Mentor',
                'show_on_website' => true,
                'website_order' => 3,
                'avatar' => '/leader-faculty.jpg',
                'linkedin' => '#',
            ]);
        } else {
            $fc->update([
                'show_on_website' => false,
                'website_order' => 3,
                'position' => 'Faculty Coordinator',
                'team' => 'Executive Board',
            ]);
        }
    }
}

