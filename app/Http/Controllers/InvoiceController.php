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
        $invoice->load(['booking.facility', 'payment']);
        abort_unless($invoice->payment?->payment_status === PaymentStatus::PAID, 404);

        return view('invoices.print', [
            'invoice' => $invoice,
            'booking' => $invoice->booking,
        ]);
    }
}
