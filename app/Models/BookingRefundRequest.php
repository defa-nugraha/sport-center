<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingRefundRequest extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
