<?php

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingRefund;
use App\Models\Facility;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\URL;

function brandedInvoiceFixture(PaymentStatus $paymentStatus): Invoice
{
    $user = User::factory()->create();
    $facility = Facility::create([
        'name' => 'Lapangan Uji Invoice',
        'slug' => 'lapangan-uji-invoice-'.uniqid(),
        'booking_enabled' => true,
        'booking_price_per_hour' => 100000,
        'published' => true,
    ]);

    $booking = Booking::create([
        'user_id' => $user->id,
        'facility_id' => $facility->id,
        'booking_mode' => 'hourly',
        'customer_name' => 'Pengguna Invoice',
        'customer_email' => 'invoice@example.test',
        'customer_phone' => '628123456789',
        'booking_date' => now()->addDay()->toDateString(),
        'booking_end_date' => now()->addDay()->toDateString(),
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'duration_minutes' => 60,
        'price_per_hour' => 100000,
        'subtotal' => 100000,
        'total' => 100000,
        'status' => BookingStatus::CONFIRMED,
        'paid_at' => now(),
    ]);

    $payment = Payment::create([
        'booking_id' => $booking->id,
        'order_id' => 'INVOICE-TEST-'.uniqid(),
        'gross_amount' => 100000,
        'payment_status' => $paymentStatus,
        'paid_at' => $paymentStatus === PaymentStatus::PAID ? now() : null,
    ]);

    return Invoice::create([
        'booking_id' => $booking->id,
        'payment_id' => $payment->id,
        'pdf_path' => 'invoices/test-invoice.pdf',
        'issued_at' => now(),
    ]);
}

test('signed invoice print page uses login partner logos and payment details', function () {
    $invoice = brandedInvoiceFixture(PaymentStatus::PAID);
    $url = URL::temporarySignedRoute(
        'invoices.print',
        now()->addMinutes(5),
        ['invoice' => $invoice->uuid],
    );

    $this->get($url)
        ->assertOk()
        ->assertSee('logo-pemda.jpeg')
        ->assertSee('logo-unma.png')
        ->assertSee('logo-pertamina.png')
        ->assertSee('logo-dispora.svg')
        ->assertSee($invoice->invoice_number)
        ->assertSee('PEMBAYARAN LUNAS')
        ->assertSee('Rp 100.000');
});

test('invoice print page refuses invoices whose payment is not paid', function () {
    $invoice = brandedInvoiceFixture(PaymentStatus::PENDING);
    $url = URL::temporarySignedRoute(
        'invoices.print',
        now()->addMinutes(5),
        ['invoice' => $invoice->uuid],
    );

    $this->get($url)->assertNotFound();
});

test('invoice print page reflects confirmed partial refund totals', function () {
    $invoice = brandedInvoiceFixture(PaymentStatus::PARTIALLY_REFUNDED);
    $invoice->payment->update([
        'transaction_status' => 'partial_refund',
        'payment_status' => PaymentStatus::PARTIALLY_REFUNDED,
    ]);

    BookingRefund::create([
        'booking_id' => $invoice->booking_id,
        'payment_id' => $invoice->payment_id,
        'refund_key' => 'INVOICE-PARTIAL-TEST',
        'amount' => 25000,
        'reason' => 'Pengembalian sebagian',
        'status' => 'confirmed',
        'requested_at' => now(),
        'confirmed_at' => now(),
    ]);

    $url = URL::temporarySignedRoute(
        'invoices.print',
        now()->addMinutes(5),
        ['invoice' => $invoice->uuid],
    );

    $this->get($url)
        ->assertOk()
        ->assertSee('REFUND SEBAGIAN')
        ->assertSee('Refund terkonfirmasi')
        ->assertSee('Rp 25.000')
        ->assertSee('Rp 75.000');
});
