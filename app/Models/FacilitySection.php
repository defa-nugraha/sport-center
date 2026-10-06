<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FacilitySection extends Model
{
    protected $guarded = [];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }
}
