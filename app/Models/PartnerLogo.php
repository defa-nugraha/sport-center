<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class PartnerLogo extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    protected $casts = ['published' => 'boolean'];
}
