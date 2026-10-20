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

    public static function refundPolicyHtml(): string
    {
        return static::value(
            'refund_policy_html',
            '<h2>Ketentuan Refund</h2><p>Ketentuan pengembalian dana belum ditetapkan. Silakan hubungi pengelola untuk memperoleh informasi sebelum menyelesaikan pemesanan.</p>',
        ) ?? '';
    }
}
