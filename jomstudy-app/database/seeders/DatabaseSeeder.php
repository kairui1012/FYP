<?php

namespace Database\Seeders;

use App\Models\SocialAccount;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SubjectsSeeder::class,
            LanguagesSeeder::class,
            BadgesSeeder::class,
            AchievementsSeeder::class,
            DemoPresentationSeeder::class,
        ]);

        // User::factory(10)->create();

        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => Hash::make('Admin@123'),
            'role' => 'admin',
        ]);

        SocialAccount::query()->updateOrCreate(
            [
                'provider' => 'demo-avatar',
                'provider_id' => $admin->email,
            ],
            [
                'user_id' => $admin->id,
                'avatar' => 'https://ui-avatars.com/api/?name=Admin&background=1f2937&color=ffffff&size=128&bold=true',
            ],
        );
    }
}
