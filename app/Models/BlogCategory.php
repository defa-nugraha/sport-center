<?php

namespace App\Models;

use App\Concerns\HasEncryptedRouteKey;

use Illuminate\Database\Eloquent\Model;

class BlogCategory extends Model
{
    use HasEncryptedRouteKey;
    protected $guarded = [];

    public function posts()
    {
        return $this->hasMany(BlogPost::class);
    }
}
