<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class FacilityGallery extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }
}
