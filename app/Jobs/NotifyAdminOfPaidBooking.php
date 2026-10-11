<?php

namespace App\Jobs;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\SiteSetting;
use App\Services\WhatsAppGateway;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NotifyAdminOfPaidBooking implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $bookingId) {}

    public function uniqueId(): string
    {
        return 'paid-booking-admin-whatsapp-'.$this->bookingId;
    }

    public function handle(WhatsAppGateway $wa): void
    {
        $booking = Booking::with(['facility', 'payment'])->find($this->bookingId);
        $payment = $booking?->payment;

        if (! $booking
            || ! $payment
            || $payment->payment_status !== PaymentStatus::PAID
            || $booking->status !== BookingStatus::CONFIRMED
            || $payment->admin_whatsapp_sent_at) {
            return;
        }

        if (SiteSetting::value('whatsapp_admin_paid_booking_enabled', '0') !== '1') {
            return;
        }

        $adminPhone = preg_replace('/[^0-9]/', '', (string) SiteSetting::value('whatsapp_admin_phone', ''));

        if (! $adminPhone || ! config('services.whatsapp.url') || ! config('services.whatsapp.api_key') || ! config('services.whatsapp.sender')) {
            Log::warning('admin paid-booking WhatsApp notification skipped because configuration is incomplete', [
                'booking_id' => $booking->id,
            ]);

            return;
        }

        $bookingDate = $booking->booking_date?->format('d-m-Y') ?? (string) $booking->booking_date;
        $endDate = $booking->booking_end_date?->format('d-m-Y') ?? $bookingDate;
        $schedule = $booking->booking_mode === 'daily'
            ? "{$bookingDate} s.d. {$endDate}"
            : "{$bookingDate}, {$booking->start_time}–{$booking->end_time}";
        $amount = 'Rp '.number_format((int) $booking->total, 0, ',', '.');
        $paymentType = $payment->payment_type ?: 'Tidak tersedia';

        $message = "PEMBAYARAN BOOKING BERHASIL\n"
            ."Nomor booking: {$booking->booking_number}\n"
            ."Pelanggan: {$booking->customer_name}\n"
            ."No. WhatsApp pelanggan: {$booking->customer_phone}\n"
            ."Venue: {$booking->facility?->name}\n"
            ."Jadwal: {$schedule}\n"
            ."Total dibayar: {$amount}\n"
            ."Metode pembayaran: {$paymentType}\n"
            .'Status: LUNAS';

        try {
            $wa->sendMessage($adminPhone, $message);
            $payment->forceFill(['admin_whatsapp_sent_at' => now()])->save();
        } catch (\Throwable $exception) {
            Log::error('admin paid-booking WhatsApp notification failed', [
                'booking_id' => $booking->id,
                'payment_id' => $payment->id,
                'error' => $exception->getMessage(),
            ]);
            throw $exception;
        }
    }
}
