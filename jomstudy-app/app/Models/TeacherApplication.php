<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeacherApplication extends Model
{
    protected $fillable = ['user_id', 'qualification', 'bio', 'status', 'admin_note'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(TeacherVerificationDocument::class);
    }
}
