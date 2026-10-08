<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class PageSection extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    protected $casts = ['enabled' => 'boolean'];
}
