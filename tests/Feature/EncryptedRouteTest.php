<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\User;

function encryptedRouteFacility(): Facility
{
    return Facility::create([
        'name' => 'Encrypted Venue',
        'slug' => 'encrypted-venue-'.uniqid(),
        'booking_enabled' => true,
        'booking_price_per_hour' => 100000,
        'published' => true,
    ]);
}

test('booking route identifiers are encrypted and resolve correctly', function () {
    $user = User::factory()->create();
    $facility = encryptedRouteFacility();
    $booking = Booking::create([
        'user_id' => $user->id,
        'facility_id' => $facility->id,
        'customer_name' => 'User',
        'customer_email' => 'user@test.test',
        'customer_phone' => '62819',
        'booking_date' => now()->addDay()->format('Y-m-d'),
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'duration_minutes' => 60,
        'price_per_hour' => 100000,
        'subtotal' => 100000,
        'total' => 100000,
        'status' => BookingStatus::PENDING_PAYMENT,
        'expires_at' => now()->addMinutes(15),
    ]);

    $url = route('booking.show', ['booking' => $booking->encrypted_id]);

    expect($url)->not->toContain('/'.$booking->id.'/');
    expect($this->actingAs($user)->get($url)->status())->toBe(200);
});

test('public facility slug routes remain readable', function () {
    $facility = encryptedRouteFacility();

    expect(route('facilities.show', ['facility' => $facility->slug]))->toContain('/facilities/'.$facility->slug);
});

test('admin facility route uses encrypted identifier', function () {
    $facility = encryptedRouteFacility();

    expect(route('admin.facilities.edit', ['facility' => $facility->encrypted_id]))
        ->not->toContain('/'.$facility->id.'/');
});
