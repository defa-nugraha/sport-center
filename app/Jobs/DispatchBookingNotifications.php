<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Services\WhatsAppGateway;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class DispatchBookingNotifications implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $bookingId) {}

    public function uniqueId(): string
    {
        return (string) $this->bookingId;
    }

    public function handle(WhatsAppGateway $wa): void
    {
        $booking = Booking::with(['facility', 'payment', 'invoice'])->find($this->bookingId);

        if (! $booking || ! $booking->invoice) {
            return;
        }

        $invoice = $booking->invoice;
        $invoiceUrl = URL::temporarySignedRoute(
            'invoices.public',
            now()->addDays(7),
            ['invoice' => $invoice->uuid],
        );

        if (! $invoice->email_sent_at) {
            try {
                Mail::to($booking->customer_email)->send(new \App\Mail\BookingInvoiceMail($booking));
                $invoice->update(['email_sent_at' => now()]);
            } catch (\Throwable $exception) {
                Log::error('booking invoice email failed', [
                    'booking_id' => $booking->id,
                    'error' => $exception->getMessage(),
                ]);
                throw $exception;
            }
        }

        if (! $invoice->whatsapp_sent_at) {
            try {
                $wa->sendMessage(
                    $booking->customer_phone,
                    "Pembayaran berhasil. Booking {$booking->booking_number} telah dikonfirmasi.\nInvoice: {$invoice->invoice_number}\n{$invoiceUrl}",
                );
                $wa->sendPdf(
                    $booking->customer_phone,
                    'Invoice '.$invoice->invoice_number.' - '.$booking->facility->name,
                    $invoiceUrl,
                );
                $invoice->update(['whatsapp_sent_at' => now()]);
            } catch (\Throwable $exception) {
                Log::error('booking invoice whatsapp failed', [
                    'booking_id' => $booking->id,
                    'error' => $exception->getMessage(),
                ]);
                throw $exception;
            }
        }

    }

}
