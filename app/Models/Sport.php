<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Sport extends Model { protected $guarded = []; public function category() { return $this->belongsTo(SportCategory::class, 'sport_category_id'); } public function facilities() { return $this->belongsToMany(Facility::class); } public function events() { return $this->hasMany(Event::class); } }
