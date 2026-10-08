<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class EventGallery extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
