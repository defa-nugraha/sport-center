<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class FacilityGallery extends Model { protected $guarded = []; public function facility() { return $this->belongsTo(Facility::class); } }
