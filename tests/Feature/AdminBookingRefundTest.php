<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingRefund;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function refundFeatureFacility(): Facility
{
    return Facility::create([
        'name' => 'Venue untuk Refund',
        'slug' => 'venue-refund-'.uniqid(),
        'booking_enabled' => true,
        'booking_price_per_hour' => 100000,
        'booking_price_per_day' => 200000,
        'booking_mode' => 'both',
        'published' => true,
        'booking_operating_start' => '07:00:00',
        'booking_operating_end' => '22:00:00',
        'booking_buffer_minutes' => 45,
    ]);
}

function refundFeatureBooking(User $user): array
{
    $facility = refundFeatureFacility();
    $booking = Booking::create([
        'user_id' => $user->id,
        'facility_id' => $facility->id,
        'customer_name' => 'Pelanggan Refund',
        'customer_email' => $user->email,
        'customer_phone' => '081234567890',
        'booking_mode' => 'daily',
        'booking_date' => '2026-10-15',
        'booking_end_date' => '2026-10-15',
        'start_time' => '08:00:00',
        'end_time' => '18:00:00',
        'duration_minutes' => 600,
        'price_per_hour' => 0,
        'price_per_day' => 200000,
        'subtotal' => 200000,
        'total' => 200000,
        'status' => BookingStatus::CONFIRMED,
        'paid_at' => now(),
    ]);

    $payment = Payment::create([
        'booking_id' => $booking->id,
        'provider' => 'midtrans',
        'order_id' => 'ORDER-REFUND-'.$booking->id,
        'transaction_id' => 'TRANSACTION-REFUND-'.$booking->id,
        'gross_amount' => 200000,
        'currency' => 'IDR',
        'transaction_status' => 'settlement',
        'payment_status' => PaymentStatus::PAID,
        'paid_at' => now(),
    ]);

    return [$booking, $payment];
}

function refundFeatureAdministrator(): User
{
    $admin = User::factory()->create();
    $role = Role::findOrCreate('administrator', 'web');
    $permission = Permission::findOrCreate('kelola booking', 'web');
    $role->givePermissionTo($permission);
    $admin->assignRole($role);

    return $admin;
}

test('administrator can request full refund but booking remains blocked pending gateway confirmation', function () {
    $admin = refundFeatureAdministrator();
    [$booking, $payment] = refundFeatureBooking($admin);

    config([
        'services.midtrans.api_url' => 'https://midtrans.test',
        'services.midtrans.server_key' => 'test-server-key',
    ]);

    Http::fake([
        'midtrans.test/v2/*/status' => Http::response([
            'order_id' => $payment->order_id,
            'transaction_id' => $payment->transaction_id,
            'transaction_status' => 'settlement',
            'gross_amount' => '200000.00',
            'currency' => 'IDR',
        ], 200),
        'midtrans.test/v2/*/refund' => Http::response([
            'status_code' => '200',
            'status_message' => 'Success, refund request is being processed',
            'order_id' => $payment->order_id,
            'transaction_id' => $payment->transaction_id,
            'transaction_status' => 'settlement',
        ], 200),
    ]);

    $this->actingAs($admin)
        ->post('/admin/bookings/'.$booking->id.'/refund', [
            'reason' => 'Venue tidak dapat digunakan',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('booking_refunds', [
        'booking_id' => $booking->id,
        'payment_id' => $payment->id,
        'admin_user_id' => $admin->id,
        'amount' => 200000,
        'reason' => 'Venue tidak dapat digunakan',
        'status' => 'requested',
    ]);
    $this->assertDatabaseHas('payments', [
        'id' => $payment->id,
        'payment_status' => PaymentStatus::REFUND_PENDING->value,
    ]);
    $this->assertDatabaseHas('bookings', [
        'id' => $booking->id,
        'status' => BookingStatus::CONFIRMED->value,
    ]);

    Http::assertSent(fn ($request) => $request->method() === 'POST'
        && str_ends_with($request->url(), '/refund')
        && $request['amount'] === 200000
        && filled($request['refund_key']));
});

test('staff with booking permission cannot submit a refund', function () {
    $staff = User::factory()->create();
    $staff->givePermissionTo(Permission::findOrCreate('kelola booking', 'web'));
    [$booking, $payment] = refundFeatureBooking($staff);

    $this->actingAs($staff)
        ->post('/admin/bookings/'.$booking->id.'/refund', ['reason' => 'Permintaan uji refund'])
        ->assertForbidden();

    $this->assertDatabaseMissing('booking_refunds', ['booking_id' => $booking->id]);
    $this->assertDatabaseHas('payments', [
        'id' => $payment->id,
        'payment_status' => PaymentStatus::PAID->value,
    ]);
});

test('refund callback only releases venue after bank confirmation', function () {
    $admin = refundFeatureAdministrator();
    [$booking, $payment] = refundFeatureBooking($admin);
    $refund = BookingRefund::create([
        'booking_id' => $booking->id,
        'payment_id' => $payment->id,
        'admin_user_id' => $admin->id,
        'refund_key' => 'GGM-REFUND-TEST-'.$booking->id,
        'amount' => 200000,
        'reason' => 'Venue tidak dapat digunakan',
        'status' => 'requested',
        'requested_at' => now(),
    ]);

    app(BookingService::class)->syncRefundStatus($payment, [
        'transaction_status' => 'refund',
        'refunds' => [[
            'refund_key' => $refund->refund_key,
            'refund_amount' => '200000',
            'bank_confirmed_at' => now()->toIso8601String(),
        ]],
    ]);

    expect($payment->fresh()->payment_status)->toBe(PaymentStatus::REFUNDED)
        ->and($booking->fresh()->status)->toBe(BookingStatus::REFUNDED)
        ->and($refund->fresh()->status)->toBe('confirmed');
});
