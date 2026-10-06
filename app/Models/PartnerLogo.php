<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartnerLogo extends Model
{
    protected $guarded = [];

    protected $casts = ['published' => 'boolean'];
}
