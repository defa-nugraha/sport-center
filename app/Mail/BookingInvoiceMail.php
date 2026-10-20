<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class BookingInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Pembayaran Berhasil - Invoice '.$this->booking->invoice->invoice_number);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-invoice',
            with: [
                'invoiceUrl' => URL::temporarySignedRoute(
                    'invoices.print',
                    now()->addDays(30),
                    ['invoice' => $this->booking->invoice->uuid],
                ),
            ],
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromStorageDisk('local', $this->booking->invoice->pdf_path)
                ->as($this->booking->invoice->invoice_number.'.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
