<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Achievement extends Model
{
    protected $fillable = [
        'key',
        'category',
        'icon',
        'metric',
        'threshold',
    ];

    protected function casts(): array
    {
        return [
            'threshold' => 'integer',
        ];
    }
}
