<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageVisit extends Model
{
    protected $fillable = [
        'path',
        'visitor_hash',
        'session_hash',
        'referrer',
        'visited_on',
    ];

    protected function casts(): array
    {
        return ['visited_on' => 'date'];
    }
}
