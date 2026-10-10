<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingRefund extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'gateway_response' => 'array',
            'requested_at' => 'datetime',
            'confirmed_at' => 'datetime',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
