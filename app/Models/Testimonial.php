<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];\n\n    public function booking() { return $this->belongsTo(Booking::class); }\n    public function user() { return $this->belongsTo(User::class); }

    protected $casts = [
        'approved' => 'boolean',
        'rating' => 'integer',
    ];
}
