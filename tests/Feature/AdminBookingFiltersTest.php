<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function adminBookingFilterFacility(string $label): Facility
{
    return Facility::create([
        'name' => $label,
        'slug' => 'filter-venue-' . uniqid(),
        'booking_enabled' => true,
        'booking_price_per_hour' => 100000,
        'published' => true,
        'booking_operating_start' => '07:00:00',
        'booking_operating_end' => '22:00:00',
        'booking_buffer_minutes' => 45,
    ]);
}

function adminBookingFilterRecord(User $user, Facility $facility, array $overrides = []): Booking
{
    return Booking::create(array_merge([
        'user_id' => $user->id,
        'facility_id' => $facility->id,
        'customer_name' => 'Andi Booking',
        'customer_email' => 'andi@example.test',
        'customer_phone' => '081234567890',
        'booking_mode' => 'daily',
        'booking_date' => '2026-10-10',
        'booking_end_date' => '2026-10-12',
        'start_time' => '08:00:00',
        'end_time' => '18:00:00',
        'duration_minutes' => 600,
        'price_per_hour' => 0,
        'price_per_day' => 250000,
        'subtotal' => 500000,
        'total' => 500000,
        'status' => BookingStatus::CONFIRMED,
    ], $overrides));
}

function grantBookingAdminAccess(User $user): void
{
    $permission = Permission::findOrCreate('kelola booking', 'web');
    $user->givePermissionTo($permission);
}

test('admin can combine booking search, date overlap, venue, mode, status, and payment filters', function () {
    $user = User::factory()->create();
    grantBookingAdminAccess($user);

    $venue = adminBookingFilterFacility('GGM Badminton Court');
    $matching = adminBookingFilterRecord($user, $venue, [
        'customer_name' => 'Andi Pratama',
        'customer_email' => 'andi.pratama@example.test',
        'booking_number' => 'BKG-FILTER-MATCH',
        'booking_date' => '2026-10-10',
        'booking_end_date' => '2026-10-12',
    ]);

    Payment::create([
        'booking_id' => $matching->id,
        'provider' => 'midtrans',
        'order_id' => 'ORDER-FILTER-MATCH',
        'gross_amount' => 500000,
        'currency' => 'IDR',
        'payment_status' => PaymentStatus::PAID,
    ]);

    adminBookingFilterRecord($user, adminBookingFilterFacility('Other Venue'), [
        'customer_name' => 'Budi Santoso',
        'customer_email' => 'budi@example.test',
        'booking_number' => 'BKG-FILTER-OTHER',
        'booking_mode' => 'hourly',
        'booking_date' => '2026-10-11',
        'booking_end_date' => null,
        'status' => BookingStatus::PENDING_PAYMENT,
    ]);

    $this->actingAs($user)
        ->get(route('admin.bookings.index', [
            'search' => 'Andi Pratama',
            'status' => 'CONFIRMED',
            'payment_status' => 'PAID',
            'facility_id' => $venue->id,
            'booking_mode' => 'daily',
            'date_from' => '2026-10-11',
            'date_to' => '2026-10-11',
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/bookings/index')
            ->where('bookings.total', 1)
            ->where('bookings.data.0.booking_number', 'BKG-FILTER-MATCH')
            ->where('filters.date_from', '2026-10-11')
            ->where('filters.payment_status', 'PAID')
            ->where('filters.booking_mode', 'daily')
        );
});

test('admin booking filters reject an end date earlier than the start date', function () {
    $user = User::factory()->create();
    grantBookingAdminAccess($user);

    $this->actingAs($user)
        ->get(route('admin.bookings.index', [
            'date_from' => '2026-10-20',
            'date_to' => '2026-10-10',
        ]))
        ->assertSessionHasErrors('date_to');
});
