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


test('booking status cannot be viewed by another user', function () {
    $owner=User::factory()->create();
    $other=User::factory()->create();
    $facility=bookingFacility();
    $booking=Booking::create(['user_id'=>$owner->id,'facility_id'=>$facility->id,'customer_name'=>'Owner','customer_email'=>'owner@test.test','customer_phone'=>'62816','booking_date'=>now()->addDay()->format('Y-m-d'),'start_time'=>'10:00:00','end_time'=>'11:00:00','duration_minutes'=>60,'price_per_hour'=>100000,'subtotal'=>100000,'total'=>100000,'status'=>BookingStatus::PENDING_PAYMENT,'expires_at'=>now()->addMinutes(15)]);
    $this->actingAs($other)->get(route('booking.show', ['booking' => $booking->encrypted_id]))->assertForbidden();
});

test('midtrans status order mismatch cannot confirm booking', function () {
    config()->set('services.midtrans.server_key','test-server-key');
    $user=User::factory()->create();
    $facility=bookingFacility();
    $booking=Booking::create(['user_id'=>$user->id,'facility_id'=>$facility->id,'customer_name'=>'User','customer_email'=>'user@test.test','customer_phone'=>'62817','booking_date'=>now()->addDay()->format('Y-m-d'),'start_time'=>'10:00:00','end_time'=>'11:00:00','duration_minutes'=>60,'price_per_hour'=>100000,'subtotal'=>100000,'total'=>100000,'status'=>BookingStatus::PENDING_PAYMENT,'expires_at'=>now()->addMinutes(15)]);
    Payment::create(['booking_id'=>$booking->id,'order_id'=>'BOOKING-TEST-MISMATCH','gross_amount'=>100000,'payment_status'=>PaymentStatus::PENDING]);
    $payload=['status_code'=>'200','gross_amount'=>'100000.00','order_id'=>'BOOKING-TEST-MISMATCH','transaction_id'=>'trx-mismatch','transaction_status'=>'settlement','fraud_status'=>'accept','signature_key'=>hash('sha512','BOOKING-TEST-MISMATCH'.'200'.'100000.00'.'test-server-key')];
    $status=[...$payload,'order_id'=>'BOOKING-OTHER'];
    Http::fake(['https://api.sandbox.midtrans.com/*'=>Http::response($status,200)]);
    $this->postJson('/payments/midtrans/notification',$payload)->assertStatus(400);
    expect($booking->fresh()->status)->toBe(BookingStatus::PENDING_PAYMENT);
});

test('invalid midtrans signature is rejected', function () {
    config()->set('services.midtrans.server_key','test-server-key');
    $payload=['status_code'=>'200','gross_amount'=>'100000.00','order_id'=>'UNKNOWN','signature_key'=>'invalid'];
    $this->postJson('/payments/midtrans/notification',$payload)->assertStatus(400);
});

test('daily booking calculates inclusive days and rejects overlapping ranges', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $facility = bookingFacility();
    $facility->update([
        'booking_mode' => 'daily',
        'booking_price_per_day' => 350000,
    ]);

    $result = app(BookingService::class)->create($facility, [
        'customer_name' => 'Daily User',
        'customer_email' => 'daily@test.test',
        'customer_phone' => '62818',
        'booking_date' => now()->addDays(2)->format('Y-m-d'),
        'booking_end_date' => now()->addDays(4)->format('Y-m-d'),
    ]);

    expect($result['booking']->booking_mode)->toBe('daily')
        ->and($result['booking']->booking_end_date->format('Y-m-d'))->toBe(now()->addDays(4)->format('Y-m-d'))
        ->and($result['booking']->duration_minutes)->toBe(4320)
        ->and($result['booking']->total)->toBe(1050000);

    expect(fn () => app(BookingService::class)->create($facility, [
        'customer_name' => 'Another User',
        'customer_email' => 'another@test.test',
        'customer_phone' => '62819',
        'booking_date' => now()->addDays(3)->format('Y-m-d'),
        'booking_end_date' => now()->addDays(5)->format('Y-m-d'),
    ]))->toThrow(RuntimeException::class);
});

test('both mode requires an explicit hourly or daily selection', function () {
    $user = User::factory()->create();
    $this->actingAs($user);
    $facility = bookingFacility();
    $facility->update([
        'booking_mode' => 'both',
        'booking_price_per_day' => 350000,
    ]);

    expect(fn () => app(BookingService::class)->create($facility, [
        'customer_name' => 'User',
        'customer_email' => 'user@test.test',
        'customer_phone' => '62820',
        'booking_date' => now()->addDays(2)->format('Y-m-d'),
        'booking_end_date' => now()->addDays(3)->format('Y-m-d'),
    ]))->toThrow(RuntimeException::class, 'Pilih mode booking per jam atau per hari.');
});

test('daily booking blocks hourly booking on every covered date', function () {
    $user = User::factory()->create();
    $facility = bookingFacility();
    $facility->update([
        'booking_mode' => 'both',
        'booking_price_per_day' => 350000,
    ]);

    app(BookingService::class)->create($facility, [
        'booking_mode' => 'daily',
        'customer_name' => 'Daily User',
        'customer_email' => 'daily@test.test',
        'customer_phone' => '62821',
        'booking_date' => now()->addDays(2)->format('Y-m-d'),
        'booking_end_date' => now()->addDays(4)->format('Y-m-d'),
    ]);

    expect(fn () => app(BookingService::class)->create($facility, [
        'booking_mode' => 'hourly',
        'customer_name' => 'Hourly User',
        'customer_email' => 'hourly@test.test',
        'customer_phone' => '62822',
        'booking_date' => now()->addDays(3)->format('Y-m-d'),
        'start_time' => '10:00',
        'duration_minutes' => 60,
    ]))->toThrow(RuntimeException::class);
});

test('hourly booking blocks daily booking on the same date', function () {
    $user = User::factory()->create();
    $facility = bookingFacility();
    $facility->update([
        'booking_mode' => 'both',
        'booking_price_per_day' => 350000,
    ]);

    app(BookingService::class)->create($facility, [
        'booking_mode' => 'hourly',
        'customer_name' => 'Hourly User',
        'customer_email' => 'hourly2@test.test',
        'customer_phone' => '62823',
        'booking_date' => now()->addDays(2)->format('Y-m-d'),
        'start_time' => '10:00',
        'duration_minutes' => 60,
    ]);

    expect(fn () => app(BookingService::class)->create($facility, [
        'booking_mode' => 'daily',
        'customer_name' => 'Daily User',
        'customer_email' => 'daily2@test.test',
        'customer_phone' => '62824',
        'booking_date' => now()->addDays(2)->format('Y-m-d'),
        'booking_end_date' => now()->addDays(3)->format('Y-m-d'),
    ]))->toThrow(RuntimeException::class);
});

