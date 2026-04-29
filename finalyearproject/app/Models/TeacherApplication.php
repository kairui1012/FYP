<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeacherApplication extends Model
{
    protected $fillable = ['user_id', 'qualification', 'bio', 'document_path', 'document_original_name', 'status', 'admin_note'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
