<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProgress extends Model
{
    protected $fillable = [
        'user_id',
        'total_questions_answered',
        'total_questions_posted',
        'total_post_posted',
        'quizzes_completed',
        'correct_answers_count',
        'total_likes_received',
        'quiz_scores',
        'improvement_score',
    ];

    protected function casts(): array
    {
        return [
            'quiz_scores'              => 'array',
            'total_questions_answered' => 'integer',
            'total_questions_posted'   => 'integer',
            'total_post_posted'        => 'integer',
            'quizzes_completed'        => 'integer',
            'correct_answers_count'    => 'integer',
            'total_likes_received'     => 'integer',
            'improvement_score'        => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function accuracyRate(): float
    {
        if ($this->total_questions_answered === 0) {
            return 0.0;
        }

        return ($this->correct_answers_count / $this->total_questions_answered) * 100;
    }
}
