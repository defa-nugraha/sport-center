<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
class Event extends Model { protected $guarded = []; protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'published' => 'boolean']; public function sport() { return $this->belongsTo(Sport::class); } public function facility() { return $this->belongsTo(Facility::class); } public function getComputedStatusAttribute(): string { if ($this->status === 'cancelled' || $this->status === 'draft') return $this->status; $now = Carbon::now(); if ($this->starts_at->isFuture()) return 'upcoming'; if ($this->ends_at && $this->ends_at->isFuture()) return 'ongoing'; return 'completed'; } }
