<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Jobs\NotifyAdminOfPaidBooking;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\SiteSetting;
use App\Services\WhatsAppGateway;
use Illuminate\Support\Facades\Http;

test('paid booking sends one WhatsApp notification to configured administrator', function () {
    config()->set('services.whatsapp.url', 'https://wa.digitalpelajar.id');
    config()->set('services.whatsapp.api_key', 'test-api-key');
    config()->set('services.whatsapp.sender', '6281111111111');

    Http::fake([
        'https://wa.digitalpelajar.id/send-message' => Http::response(['success' => true], 200),
    ]);

    SiteSetting::create(['key' => 'whatsapp_admin_paid_booking_enabled', 'value' => '1']);
    SiteSetting::create(['key' => 'whatsapp_admin_phone', 'value' => '6281234567890']);

    $facility = Facility::create([
        'name' => 'Lapangan Badminton',
        'slug' => 'lapangan-badminton-wa-test',
        'booking_enabled' => true,
        'booking_price_per_hour' => 100000,
        'published' => true,
    ]);
    $booking = Booking::create([
        'facility_id' => $facility->id,
        'customer_name' => 'Andi Pratama',
        'customer_email' => 'andi@example.test',
        'customer_phone' => '6281555555555',
        'booking_mode' => 'hourly',
        'booking_date' => '2026-10-12',
        'booking_end_date' => '2026-10-12',
        'start_time' => '10:00:00',
        'end_time' => '12:00:00',
        'duration_minutes' => 120,
        'price_per_hour' => 100000,
        'subtotal' => 200000,
        'total' => 200000,
        'status' => BookingStatus::CONFIRMED,
        'paid_at' => now(),
    ]);
    $payment = Payment::create([
        'booking_id' => $booking->id,
        'order_id' => 'WA-PAID-BOOKING-TEST',
        'gross_amount' => 200000,
        'payment_status' => PaymentStatus::PAID,
        'payment_type' => 'bank_transfer',
        'paid_at' => now(),
    ]);

    $job = new NotifyAdminOfPaidBooking($booking->id);
    $job->handle(app(WhatsAppGateway::class));
    $job->handle(app(WhatsAppGateway::class));

    Http::assertSentCount(1);
    Http::assertSent(fn ($request) => $request->url() === 'https://wa.digitalpelajar.id/send-message'
        && $request['number'] === '6281234567890'
        && str_contains($request['message'], 'BKG-')
        && str_contains($request['message'], 'Andi Pratama')
        && str_contains($request['message'], 'Rp 200.000')
        && str_contains($request['message'], 'Status: LUNAS'));

    expect($payment->fresh()->admin_whatsapp_sent_at)->not->toBeNull();
});

test('paid booking does not send WhatsApp when the admin notification setting is disabled', function () {
    config()->set('services.whatsapp.api_key', 'test-api-key');
    config()->set('services.whatsapp.sender', '6281111111111');

    Http::fake();
    SiteSetting::create(['key' => 'whatsapp_admin_paid_booking_enabled', 'value' => '0']);
    SiteSetting::create(['key' => 'whatsapp_admin_phone', 'value' => '6281234567890']);

    $facility = Facility::create([
        'name' => 'Lapangan Futsal',
        'slug' => 'lapangan-futsal-wa-disabled',
        'booking_enabled' => true,
        'booking_price_per_hour' => 100000,
        'published' => true,
    ]);
    $booking = Booking::create([
        'facility_id' => $facility->id,
        'customer_name' => 'Budi',
        'customer_email' => 'budi@example.test',
        'customer_phone' => '6281555555555',
        'booking_mode' => 'hourly',
        'booking_date' => '2026-10-12',
        'booking_end_date' => '2026-10-12',
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'duration_minutes' => 60,
        'price_per_hour' => 100000,
        'subtotal' => 100000,
        'total' => 100000,
        'status' => BookingStatus::CONFIRMED,
        'paid_at' => now(),
    ]);
    Payment::create([
        'booking_id' => $booking->id,
        'order_id' => 'WA-PAID-BOOKING-DISABLED',
        'gross_amount' => 100000,
        'payment_status' => PaymentStatus::PAID,
        'paid_at' => now(),
    ]);

    (new NotifyAdminOfPaidBooking($booking->id))->handle(app(WhatsAppGateway::class));

    Http::assertNothingSent();
});
