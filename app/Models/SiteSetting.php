<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $guarded = [];

    public static function value(string $key, ?string $fallback = null): ?string
    {
        return static::where('key', $key)->value('value') ?? $fallback;
    }
}
