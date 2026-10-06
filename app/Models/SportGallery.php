<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SportGallery extends Model
{
    protected $guarded = [];

    public function sport()
    {
        return $this->belongsTo(Sport::class);
    }
}
