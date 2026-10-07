<?php
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Support\Facades\Http;

function bookingFacility(): Facility {
    return Facility::create([
        'name'=>'Test Venue','slug'=>'test-venue-'.uniqid(),'booking_enabled'=>true,'booking_price_per_hour'=>100000,'published'=>true,
    ]);
}

test('availability rejects overlapping booking and allows adjacent booking', function () {
    $user=User::factory()->create();
    $facility=bookingFacility();
    Booking::create([
        'user_id'=>$user->id,'facility_id'=>$facility->id,'customer_name'=>'A','customer_email'=>'a@test.test','customer_phone'=>'62812',
        'booking_date'=>'2026-10-10','start_time'=>'10:00:00','end_time'=>'12:00:00','duration_minutes'=>120,'price_per_hour'=>100000,'subtotal'=>200000,'total'=>200000,'status'=>BookingStatus::CONFIRMED,
    ]);
    $service=app(BookingService::class);
    expect(fn()=> $service->create($facility,['customer_name'=>'B','customer_email'=>'b@test.test','customer_phone'=>'62813','booking_date'=>'2026-10-10','start_time'=>'11:00','duration_minutes'=>60]))->toThrow(RuntimeException::class);
    $result=$service->create($facility,['customer_name'=>'C','customer_email'=>'c@test.test','customer_phone'=>'62814','booking_date'=>'2026-10-10','start_time'=>'12:00','duration_minutes'=>60]);
    expect($result['booking']->start_time)->toBe('12:00:00');
});

test('booking creates temporary hold and calculated end time', function () {
    $user=User::factory()->create();
    $this->actingAs($user);
    $facility=bookingFacility();
    $result=app(BookingService::class)->create($facility,['customer_name'=>'User','customer_email'=>'user@test.test','customer_phone'=>'62815','booking_date'=>now()->addDay()->format('Y-m-d'),'start_time'=>'10:00','duration_minutes'=>120]);
    expect($result['booking']->status)->toBe(BookingStatus::PENDING_PAYMENT)->and($result['booking']->end_time)->toBe('12:00:00')->and($result['booking']->expires_at)->not->toBeNull()->and($result['booking']->total)->toBe(200000);
});

test('midtrans webhook is verified and idempotently confirms booking and creates one invoice', function () {
    config()->set('services.midtrans.server_key','test-server-key');
    $user=User::factory()->create();
    $facility=bookingFacility();
    $booking=Booking::create(['user_id'=>$user->id,'facility_id'=>$facility->id,'customer_name'=>'User','customer_email'=>'user@test.test','customer_phone'=>'62816','booking_date'=>now()->addDay()->format('Y-m-d'),'start_time'=>'10:00:00','end_time'=>'11:00:00','duration_minutes'=>60,'price_per_hour'=>100000,'subtotal'=>100000,'total'=>100000,'status'=>BookingStatus::PENDING_PAYMENT,'expires_at'=>now()->addMinutes(15)]);
    $payment=Payment::create(['booking_id'=>$booking->id,'order_id'=>'BOOKING-TEST-1','gross_amount'=>100000,'payment_status'=>PaymentStatus::PENDING]);
    $status=['status_code'=>'200','gross_amount'=>'100000.00','order_id'=>'BOOKING-TEST-1','transaction_id'=>'trx-1','transaction_status'=>'settlement','fraud_status'=>'accept','payment_type'=>'bank_transfer','signature_key'=>hash('sha512','BOOKING-TEST-1'.'200'.'100000.00'.'test-server-key')];
    Http::fake(['https://api.sandbox.midtrans.com/*'=>Http::response($status,200)]);
    $this->postJson('/payments/midtrans/notification',$status)->assertOk();
    expect($booking->fresh()->status)->toBe(BookingStatus::CONFIRMED)->and($payment->fresh()->payment_status)->toBe(PaymentStatus::PAID);
    $this->postJson('/payments/midtrans/notification',$status)->assertOk();
    expect($booking->fresh()->invoice()->count())->toBe(1);
});

test('invalid midtrans signature is rejected', function () {
    config()->set('services.midtrans.server_key','test-server-key');
    $payload=['status_code'=>'200','gross_amount'=>'100000.00','order_id'=>'UNKNOWN','signature_key'=>'invalid'];
    $this->postJson('/payments/midtrans/notification',$payload)->assertStatus(400);
});
