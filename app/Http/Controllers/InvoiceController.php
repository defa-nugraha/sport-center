<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Models\Invoice;
use Illuminate\Support\Facades\Storage;

class InvoiceController extends Controller
{
    public function show(Invoice $invoice)
    {
        abort_unless(Storage::disk('local')->exists($invoice->pdf_path), 404);

        return response()->file(
            Storage::disk('local')->path($invoice->pdf_path),
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$invoice->invoice_number.'.pdf"',
            ],
        );
    }

    public function print(Invoice $invoice)
    {
        $invoice->load(['booking.facility', 'booking.refunds', 'payment']);
        $paymentStatus = $invoice->payment?->payment_status;

        abort_unless(in_array($paymentStatus, [
            PaymentStatus::PAID,
            PaymentStatus::REFUND_PENDING,
            PaymentStatus::PARTIALLY_REFUNDED,
            PaymentStatus::REFUNDED,
        ], true), 404);

        $refunds = $invoice->booking->refunds;
        $confirmedRefundAmount = (int) $refunds->where('status', 'confirmed')->sum('amount');
        $pendingRefundAmount = (int) $refunds->where('status', 'requested')->sum('amount');
        $remainingAmount = max(0, (int) $invoice->payment->gross_amount - $confirmedRefundAmount);

        $paymentStatusLabel = match ($paymentStatus) {
            PaymentStatus::REFUND_PENDING => 'REFUND SEDANG DIPROSES',
            PaymentStatus::PARTIALLY_REFUNDED => 'REFUND SEBAGIAN',
            PaymentStatus::REFUNDED => 'PEMBAYARAN DIREFUND PENUH',
            default => 'PEMBAYARAN LUNAS',
        };

        return view('invoices.print', [
            'invoice' => $invoice,
            'booking' => $invoice->booking,
            'paymentStatusLabel' => $paymentStatusLabel,
            'confirmedRefundAmount' => $confirmedRefundAmount,
            'pendingRefundAmount' => $pendingRefundAmount,
            'remainingAmount' => $remainingAmount,
        ]);
    }
}
