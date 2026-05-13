<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherVerificationDocument extends Model
{
    protected $fillable = [
        'teacher_application_id',
        'user_id',
        'path',
        'original_name',
        'file_path',
        'document_type',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(TeacherApplication::class, 'teacher_application_id');
    }
}
