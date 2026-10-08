<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class HomepageHighlight extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    protected $casts = ['published' => 'boolean'];
}
