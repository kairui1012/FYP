<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BadgesSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            [
                'key'              => 'rookie_author',
                'name'             => 'Rookie Author',
                'description'      => 'Earn 50 points by posting and receiving likes.',
                'icon'             => 'Sparkles',
                'points_required'  => 50,
            ],
            [
                'key'              => 'rising_star',
                'name'             => 'Rising Star',
                'description'      => 'Earn 150 points by posting and receiving likes.',
                'icon'             => 'Star',
                'points_required'  => 150,
            ],
            [
                'key'              => 'community_hero',
                'name'             => 'Community Hero',
                'description'      => 'Earn 300 points by posting and receiving likes.',
                'icon'             => 'Trophy',
                'points_required'  => 300,
            ],
            [
                'key'              => 'legend',
                'name'             => 'Legend',
                'description'      => 'Earn 600 points by posting and receiving likes.',
                'icon'             => 'Crown',
                'points_required'  => 600,
            ],
        ];

        foreach ($badges as $badge) {
            DB::table('badges')->updateOrInsert(
                ['key' => $badge['key']],
                array_merge($badge, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]),
            );
        }
    }
}
