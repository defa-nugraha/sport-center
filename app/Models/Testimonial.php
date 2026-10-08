<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    protected $casts = [
        'approved' => 'boolean',
        'rating' => 'integer',
    ];
}
