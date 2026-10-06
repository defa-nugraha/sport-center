<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facility extends Model
{
    protected $guarded = [];

    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    public function sports()
    {
        return $this->belongsToMany(Sport::class);
    }

    public function features()
    {
        return $this->hasMany(FacilityFeature::class);
    }

    public function specifications()
    {
        return $this->hasMany(FacilitySpecification::class)->orderBy('sort_order');
    }

    public function contentSections()
    {
        return $this->hasMany(FacilitySection::class)->orderBy('sort_order');
    }

    public function galleries()
    {
        return $this->hasMany(FacilityGallery::class);
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }
}
