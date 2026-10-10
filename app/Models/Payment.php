<?php
namespace App\Models;use App\Enums\PaymentStatus;use Illuminate\Database\Eloquent\Model;
class Payment extends Model{protected $guarded=[];protected $casts=['metadata'=>'array','paid_at'=>'datetime','expired_at'=>'datetime','payment_status'=>PaymentStatus::class];public function booking(){return $this->belongsTo(Booking::class);}public function refunds(){return $this->hasMany(BookingRefund::class);}}
