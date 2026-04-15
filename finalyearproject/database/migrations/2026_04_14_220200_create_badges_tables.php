<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('description');
            $table->string('icon')->nullable();
            $table->unsignedInteger('points_required');
            $table->timestamps();
        });

        Schema::create('badge_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained()->cascadeOnDelete();
            $table->timestamp('awarded_at');
            $table->timestamps();

            $table->unique(['user_id', 'badge_id']);
        });

        DB::table('badges')->insert([
            [
                'key' => 'rookie_author',
                'name' => 'Rookie Author',
                'description' => 'Earn 50 points by posting and receiving likes.',
                'icon' => 'Sparkles',
                'points_required' => 50,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'rising_star',
                'name' => 'Rising Star',
                'description' => 'Earn 150 points by posting and receiving likes.',
                'icon' => 'Star',
                'points_required' => 150,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'community_hero',
                'name' => 'Community Hero',
                'description' => 'Earn 300 points by posting and receiving likes.',
                'icon' => 'Trophy',
                'points_required' => 300,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'legend',
                'name' => 'Legend',
                'description' => 'Earn 600 points by posting and receiving likes.',
                'icon' => 'Crown',
                'points_required' => 600,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('badge_user');
        Schema::dropIfExists('badges');
    }
};
