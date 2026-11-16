<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;

class ImportExcelUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('data_users_to_import.json');

        if (!File::exists($jsonPath)) {
            $this->command->error("JSON data file not found at: {$jsonPath}");
            return;
        }

        $records = json_decode(File::get($jsonPath), true);
        if (!is_array($records)) {
            $this->command->error("Invalid JSON data format.");
            return;
        }

        $defaultPassword = Hash::make('Codezen@2026');
        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($records as $row) {
            $email = isset($row['email']) ? strtolower(trim($row['email'])) : null;
            $name = isset($row['name']) ? trim($row['name']) : 'User';
            $semester = isset($row['semester']) ? trim($row['semester']) : null;
            $branch = isset($row['branch']) ? trim($row['branch']) : null;

            if (empty($email)) {
                $skipped++;
                continue;
            }

            // Check if user already exists
            $existing = User::where('email', $email)->first();

            if ($existing) {
                // Keep their existing password, role, etc., but update semester or name if missing
                $updatedFields = [];
                if (empty($existing->semester) && $semester) {
                    $updatedFields['semester'] = $semester;
                }
                if (empty($existing->branch) && $branch) {
                    $updatedFields['branch'] = $branch;
                }
                if (!empty($updatedFields)) {
                    $existing->update($updatedFields);
                    $updated++;
                } else {
                    $skipped++;
                }
            } else {
                User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $defaultPassword,
                    'role' => 'User',
                    'type' => 'User',
                    'semester' => $semester,
                    'branch' => $branch,
                    'college' => 'Chandigarh Engineering College (CEC)',
                    'university' => 'Autonomous',
                    'course' => 'B.Tech',
                    'profile_completed' => false,
                    'show_on_website' => false,
                ]);
                $created++;
            }
        }

        $this->command->info("Import completed successfully!");
        $this->command->info("New Users Created: {$created}");
        $this->command->info("Existing Users Updated: {$updated}");
        $this->command->info("Skipped / Unchanged: {$skipped}");
    }
}
