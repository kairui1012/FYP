<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    protected $table = 'quiz_mistakes';

    protected $fillable = [
        'user_id',
        'post_id',
        'question_index',
        'selected_answer_index',
        'is_correct',
        'attempted_at',
    ];

    protected function casts(): array
    {
        return [
            'question_index' => 'integer',
            'selected_answer_index' => 'integer',
            'is_correct' => 'boolean',
            'attempted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}