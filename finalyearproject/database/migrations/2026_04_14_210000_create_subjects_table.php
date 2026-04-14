<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        DB::table('subjects')->insert([
            ['name' => 'General Studies', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Mathematics', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Additional Mathematics', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Physics', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Chemistry', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Biology', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Science', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Computer Science', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Islamic Studies', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Moral Studies', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Malay Language', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'English Language', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Chinese Language', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Tamil Language', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'History', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Geography', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Civics and Citizenship', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Economics', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Accounting', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Business Studies', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Art', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Music', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Physical Education', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Design and Technology', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};