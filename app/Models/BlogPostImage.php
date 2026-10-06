<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPostImage extends Model
{
    protected $guarded = [];

    public function post()
    {
        return $this->belongsTo(BlogPost::class, 'blog_post_id');
    }
}
