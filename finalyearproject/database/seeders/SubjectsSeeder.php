<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectsSeeder extends Seeder
{
    /**
     * Seed the application's subjects.
     */
    public function run(): void
    {
        $subjects = [
            'General Studies',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'Computer Science',
            'Business',
            'Economics',
            'Accounting',
            'History',
            'Geography',
            'English',
        ];

        foreach ($subjects as $subject) {
            Subject::query()->updateOrCreate([
                'name' => $subject,
            ]);
        }
    }
}