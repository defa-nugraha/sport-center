<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeamMember extends Model
{
    protected $guarded = [];
    protected $casts = [
        'published' => 'boolean',
        'sort_order' => 'integer',
    ];
}
