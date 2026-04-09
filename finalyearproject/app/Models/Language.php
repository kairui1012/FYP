<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    protected $fillable = [
        'code',
        'name',
    ];

    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
