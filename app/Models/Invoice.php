<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;use Illuminate\Support\Str;
class Invoice extends Model{protected $guarded=[];protected $casts=['issued_at'=>'datetime','email_sent_at'=>'datetime','whatsapp_sent_at'=>'datetime'];protected static function booted():void{static::creating(function(Invoice $i){$i->uuid??=(string)Str::uuid();$i->invoice_number??='INV-'.now()->format('Ym').'-'.strtoupper(Str::random(8));});}public function booking(){return $this->belongsTo(Booking::class);}public function payment(){return $this->belongsTo(Payment::class);}}
