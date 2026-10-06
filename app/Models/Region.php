<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $guarded = [];

    public function facilities()
    {
        return $this->hasMany(Facility::class);
    }
}
