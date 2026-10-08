<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class SportGallery extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    public function sport()
    {
        return $this->belongsTo(Sport::class);
    }
}
