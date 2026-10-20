<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Invoice;
use Illuminate\Support\Facades\Storage;

class InvoicePdfService
{
    public function generate(Invoice $invoice): string
    {
        $invoice->loadMissing(['booking.facility', 'booking.refunds', 'payment']);
        $booking = $invoice->booking;
        $payment = $invoice->payment ?? $booking->payment;
        $confirmedRefund = (int) $booking->refunds->where('status', 'confirmed')->sum('amount');
        $pendingRefund = (int) $booking->refunds->where('status', 'requested')->sum('amount');
        $grossAmount = (int) ($payment?->gross_amount ?? $booking->total);
        $remainingAmount = max(0, $grossAmount - $confirmedRefund);

        $statusLabel = match ($payment?->payment_status) {
            PaymentStatus::REFUND_PENDING => 'REFUND PENDING',
            PaymentStatus::PARTIALLY_REFUNDED => 'PARTIALLY REFUNDED',
            PaymentStatus::REFUNDED => 'REFUNDED',
            default => 'PAID',
        };

        $lines = [
            'GGM MAJALENGKA',
            'INVOICE '.$invoice->invoice_number,
            'Booking: '.$booking->booking_number,
            'Customer: '.$booking->customer_name,
            'Email: '.$booking->customer_email,
            'Phone: '.$booking->customer_phone,
            'Facility: '.($booking->facility?->name ?? 'GGM Facility'),
            'Date: '.$booking->booking_date->format('d-m-Y'),
            'Time: '.substr((string) $booking->start_time, 0, 5).' - '.substr((string) $booking->end_time, 0, 5),
            'Payment status: '.$statusLabel,
            'Original total: Rp '.number_format($grossAmount, 0, ',', '.'),
            'Confirmed refund: Rp '.number_format($confirmedRefund, 0, ',', '.'),
        ];

        if ($pendingRefund > 0) {
            $lines[] = 'Refund pending confirmation: Rp '.number_format($pendingRefund, 0, ',', '.');
        }

        $lines[] = 'Remaining after confirmed refund: Rp '.number_format($remainingAmount, 0, ',', '.');
        $lines[] = 'Paid at: '.optional($payment?->paid_at ?? $booking->paid_at)->format('d-m-Y H:i');

        $escape = static fn ($value) => str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            (string) $value,
        );

        $stream = "BT /F1 12 Tf 50 800 Td ";
        foreach ($lines as $index => $line) {
            if ($index > 0) {
                $stream .= "0 -24 Td ";
            }
            $stream .= '('.$escape($line).') Tj ';
        }
        $stream .= 'ET';

        $pdf = "%PDF-1.4\n";
        $objects = [
            1, '<< /Type /Catalog /Pages 2 0 R >>',
            2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            5, '<< /Length '.strlen($stream).' >>'."\nstream\n".$stream."\nendstream",
        ];
        $offsets = [0];

        foreach (array_chunk($objects, 2) as [$number, $object]) {
            $offsets[$number] = strlen($pdf);
            $pdf .= $number." 0 obj\n".$object."\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 6\n0000000000 65535 f \n";
        for ($index = 1; $index <= 5; $index++) {
            $pdf .= sprintf('%010d 00000 n \n', $offsets[$index]);
        }
        $pdf .= "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF";

        $path = 'invoices/'.$invoice->invoice_number.'.pdf';
        Storage::disk('local')->put($path, $pdf);

        return $path;
    }
}
