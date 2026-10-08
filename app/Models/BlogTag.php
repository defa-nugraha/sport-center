<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class BlogTag extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    public function posts()
    {
        return $this->belongsToMany(BlogPost::class);
    }
}
