<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomepageHighlight extends Model
{
    protected $guarded = [];

    protected $casts = ['published' => 'boolean'];
}
