<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\MidtransRefundRejectedException;
use App\Exceptions\MidtransRefundUncertainException;
use App\Models\Booking;
use App\Models\BookingRefund;
use App\Models\Facility;
use App\Models\Payment;
use App\Services\BookingService;
use App\Services\MidtransService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminBookingController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(array_map(static fn (BookingStatus $status) => $status->value, BookingStatus::cases()))],
            'payment_status' => ['nullable', Rule::in(array_map(static fn (PaymentStatus $status) => $status->value, PaymentStatus::cases()))],
            'facility_id' => ['nullable', 'integer', 'exists:facilities,id'],
            'booking_mode' => ['nullable', Rule::in(['hourly', 'daily'])],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $search = trim((string) ($filters['search'] ?? ''));
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;

        if ($dateFrom && $dateTo && $dateTo < $dateFrom) {
            throw ValidationException::withMessages([
                'date_to' => 'Tanggal akhir harus sama dengan atau setelah tanggal awal.',
            ]);
        }

        $query = Booking::query()
            ->with(['facility', 'payment', 'invoice', 'refunds', 'refundRequests'])
            ->latest();

        if ($search !== '') {
            $query->where(function ($bookingQuery) use ($search) {
                $term = '%' . $search . '%';

                $bookingQuery
                    ->where('booking_number', 'like', $term)
                    ->orWhere('customer_name', 'like', $term)
                    ->orWhere('customer_email', 'like', $term)
                    ->orWhere('customer_phone', 'like', $term)
                    ->orWhereHas('facility', fn ($facilityQuery) => $facilityQuery->where('name', 'like', $term))
                    ->orWhereHas('payment', function ($paymentQuery) use ($term) {
                        $paymentQuery->where(function ($query) use ($term) {
                            $query->where('order_id', 'like', $term)
                                ->orWhere('transaction_id', 'like', $term);
                        });
                    });
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->whereHas('payment', fn ($paymentQuery) => $paymentQuery->where('payment_status', $filters['payment_status']));
        }

        if (!empty($filters['facility_id'])) {
            $query->where('facility_id', $filters['facility_id']);
        }

        if (!empty($filters['booking_mode'])) {
            $query->where('booking_mode', $filters['booking_mode']);
        }

        // Include daily reservations that overlap the selected date range.
        if ($dateFrom) {
            $query->whereRaw('COALESCE(bookings.booking_end_date, bookings.booking_date) >= ?', [$dateFrom]);
        }

        if ($dateTo) {
            $query->whereDate('bookings.booking_date', '<=', $dateTo);
        }

        return Inertia::render('admin/bookings/index', [
            'bookings' => $query->paginate(20)->withQueryString(),
            'statuses' => array_map(static fn (BookingStatus $status) => $status->value, BookingStatus::cases()),
            'paymentStatuses' => array_map(static fn (PaymentStatus $status) => $status->value, PaymentStatus::cases()),
            'facilities' => Facility::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'status' => $filters['status'] ?? '',
                'payment_status' => $filters['payment_status'] ?? '',
                'facility_id' => (string) ($filters['facility_id'] ?? ''),
                'booking_mode' => $filters['booking_mode'] ?? '',
                'date_from' => $dateFrom ?? '',
                'date_to' => $dateTo ?? '',
            ],
        ]);
    }

    public function settings()
    {
        return Inertia::render('admin/bookings/settings', [
            'facilities' => Facility::orderBy('name')->get([
                'id',
                'name',
                'booking_enabled',
                'booking_mode',
                'booking_price_per_hour',
                'booking_price_per_day',
                'booking_min_hours',
                'booking_operating_start',
                'booking_operating_end',
                'booking_buffer_minutes',
            ]),
        ]);
    }

    public function show(Request $request, Booking $booking)
    {
        $booking->load(['facility', 'payment', 'invoice', 'user']);

        $customerRefundRequests = \App\Models\BookingRefundRequest::query()
            ->where('booking_id', $booking->id)
            ->with('user')
            ->latest('id')
            ->get()
            ->map(fn ($refundRequest) => [
                'id' => $refundRequest->id,
                'status' => $refundRequest->status,
                'reason' => $refundRequest->reason,
                'admin_note' => $refundRequest->admin_note,
                'created_at' => $refundRequest->created_at,
                'reviewed_at' => $refundRequest->reviewed_at,
                'user_name' => $refundRequest->user?->name,
            ]);

        $refunds = $booking->refunds()->with('admin')->latest('id')->get()->map(
            fn (BookingRefund $refund) => [
                'id' => $refund->id,
                'refund_key' => $refund->refund_key,
                'amount' => $refund->amount,
                'reason' => $refund->reason,
                'status' => $refund->status,
                'error_message' => $refund->error_message,
                'requested_at' => $refund->requested_at,
                'confirmed_at' => $refund->confirmed_at,
                'admin_name' => $refund->admin?->name,
            ],
        );

        return Inertia::render('admin/bookings/show', [
            'booking' => $booking,
            'refunds' => $refunds,
            'customerRefundRequests' => $customerRefundRequests,
            'canRefund' => $request->user()?->hasRole('administrator') && $this->isRefundable($booking),
            'refundRemaining' => max(0, (int) ($booking->payment?->gross_amount ?? 0) - (int) $booking->refunds()->where('status', 'confirmed')->sum('amount')),
            'canPartialRefund' => ! in_array(strtolower((string) $booking->payment?->payment_type), ['shopeepay', 'ovo'], true),
        ]);
    }

    public function refund(Request $request, Booking $booking, MidtransService $midtrans, BookingService $bookingService)
    {
        abort_unless($request->user()?->hasRole('administrator'), 403);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:255'],
            'amount' => ['required', 'integer', 'min:1'],
        ]);

        $refund = DB::transaction(function () use ($booking, $request, $data) {
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            $payment = Payment::query()
                ->where('booking_id', $lockedBooking->id)
                ->lockForUpdate()
                ->first();

            if (! $payment || ! $this->isRefundable($lockedBooking->loadMissing('payment'))) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'refund' => 'Booking tidak memenuhi syarat refund. Pembayaran harus berstatus lunas atau refund sebagian, dan transaksi harus memenuhi ketentuan Midtrans.',
                ]);
            }

            $alreadyRefunded = BookingRefund::query()
                ->where('booking_id', $lockedBooking->id)
                ->where('status', 'requested')
                ->exists();

            if ($alreadyRefunded) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'refund' => 'Refund untuk booking ini sedang diproses atau sudah dikonfirmasi.',
                ]);
            }

            $confirmedAmount = (int) BookingRefund::query()
                ->where('payment_id', $payment->id)
                ->where('status', 'confirmed')
                ->sum('amount');
            $remainingAmount = max(0, $payment->gross_amount - $confirmedAmount);

            if ((int) $data['amount'] > $remainingAmount) {
                throw ValidationException::withMessages([
                    'amount' => 'Nominal refund melebihi sisa transaksi yang belum dikembalikan.',
                ]);
            }

            if (in_array(strtolower((string) $payment->payment_type), ['shopeepay', 'ovo'], true)
                && (int) $data['amount'] !== $remainingAmount) {
                throw ValidationException::withMessages([
                    'amount' => 'Metode pembayaran ini tidak mendukung refund sebagian melalui Midtrans. Masukkan seluruh sisa nominal.',
                ]);
            }

            $refund = BookingRefund::create([
                'booking_id' => $lockedBooking->id,
                'payment_id' => $payment->id,
                'admin_user_id' => $request->user()->id,
                'refund_key' => 'GGM-REFUND-'.$lockedBooking->id.'-'.Str::upper(Str::random(10)),
                'amount' => (int) $data['amount'],
                'reason' => $data['reason'],
                'status' => 'requested',
                'requested_at' => now(),
            ]);

            $payment->payment_status = PaymentStatus::REFUND_PENDING;
            $payment->save();

            return $refund;
        });

        $gatewayRequestStarted = false;

        try {
            $payment = Payment::query()->findOrFail($refund->payment_id);
            $gatewayStatus = $midtrans->getStatus($payment->order_id);

            if (
                ($gatewayStatus['order_id'] ?? null) !== $payment->order_id
                || ! in_array(strtolower((string) ($gatewayStatus['transaction_status'] ?? '')), ['settlement', 'partial_refund'], true)
                || strtoupper((string) ($gatewayStatus['currency'] ?? 'IDR')) !== 'IDR'
                || (int) round((float) ($gatewayStatus['gross_amount'] ?? -1)) !== $payment->gross_amount
            ) {
                throw new MidtransRefundRejectedException('Status transaksi Midtrans tidak lagi memenuhi syarat refund.');
            }

            $localConfirmedRefunds = (int) BookingRefund::query()
                ->where('payment_id', $payment->id)
                ->where('status', 'confirmed')
                ->sum('amount');
            $gatewayConfirmedRefunds = (int) round((float) ($gatewayStatus['refund_amount'] ?? 0));
            $confirmedRefunds = max($localConfirmedRefunds, $gatewayConfirmedRefunds);
            $gatewayRemainingAmount = max(0, $payment->gross_amount - $confirmedRefunds);

            if ((int) $refund->amount > $gatewayRemainingAmount) {
                throw new MidtransRefundRejectedException('REFUND_AMOUNT_EXCEEDS_REMAINING');
            }

            if (in_array(strtolower((string) $payment->payment_type), ['shopeepay', 'ovo'], true)
                && (int) $refund->amount !== $gatewayRemainingAmount) {
                throw new MidtransRefundRejectedException('REFUND_PARTIAL_NOT_SUPPORTED');
            }

            \App\Models\BookingRefundRequest::query()
                ->where('booking_id', $booking->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'reviewed',
                    'admin_note' => 'Nominal refund ditentukan admin dan diteruskan ke Midtrans.',
                    'reviewed_at' => now(),
                ]);

            $gatewayRequestStarted = true;
            $response = $midtrans->refund(
                $payment->order_id,
                $refund->refund_key,
                $refund->reason,
                (int) $refund->amount,
            );

            $refund->update(['gateway_response' => $response]);
            $bookingService->syncRefundStatus($payment, $response);

            return back()->with(
                'success',
                $refund->fresh()->status === 'confirmed'
                    ? 'Refund berhasil dikonfirmasi oleh Midtrans.'
                    : 'Permintaan refund diteruskan ke Midtrans. Status invoice dan pembayaran akan diperbarui setelah konfirmasi gateway.',
            );
        } catch (MidtransRefundRejectedException $exception) {
            $this->markRefundFailed($refund, $exception->getMessage());

            if (isset($gatewayStatus) && in_array(
                strtolower((string) ($gatewayStatus['transaction_status'] ?? '')),
                ['refund', 'partial_refund'],
                true,
            )) {
                $bookingService->syncRefundStatus($payment, $gatewayStatus);
            }

            if ($exception->getMessage() === 'REFUND_AMOUNT_EXCEEDS_REMAINING') {
                return back()->withErrors([
                    'amount' => 'Nominal refund melebihi sisa transaksi yang dilaporkan Midtrans.',
                ]);
            }

            if ($exception->getMessage() === 'REFUND_PARTIAL_NOT_SUPPORTED') {
                return back()->withErrors([
                    'amount' => 'Metode pembayaran ini tidak mendukung refund sebagian. Masukkan seluruh sisa transaksi.',
                ]);
            }

            Log::warning('Midtrans refund rejected', [
                'booking_id' => $booking->id,
                'refund_key' => $refund->refund_key,
                'message' => $exception->getMessage(),
            ]);

            return back()->withErrors(['refund' => 'Midtrans menolak refund. Status pembayaran dikembalikan sesuai jumlah refund yang telah dikonfirmasi.']);
        } catch (MidtransRefundUncertainException $exception) {
            $refund->update(['error_message' => 'Respons gateway belum dapat dipastikan; menunggu rekonsiliasi.']);
            $bookingService->refreshInvoiceAfterRefund($refund->payment_id);

            Log::warning('Midtrans refund outcome is uncertain', [
                'booking_id' => $booking->id,
                'refund_key' => $refund->refund_key,
                'request_started' => $gatewayRequestStarted,
            ]);

            return back()->with(
                'success',
                'Respons refund belum dapat dipastikan. Permintaan tidak diulang agar tidak terjadi refund ganda; periksa status transaksi Midtrans.',
            );
        } catch (ConnectionException $exception) {
            // The refund endpoint was not called yet; failure to verify status is safe to retry.
            $this->markRefundFailed($refund, $exception->getMessage());

            Log::warning('Unable to verify Midtrans transaction before refund', [
                'booking_id' => $booking->id,
                'refund_key' => $refund->refund_key,
            ]);

            return back()->withErrors([
                'refund' => 'Status transaksi tidak dapat diverifikasi. Tidak ada permintaan refund yang dikirim; silakan coba lagi nanti.',
            ]);
        } catch (\Throwable $exception) {
            if ($gatewayRequestStarted) {
                $refund->update(['error_message' => 'Respons gateway belum dapat dipastikan; menunggu rekonsiliasi.']);
                $bookingService->refreshInvoiceAfterRefund($refund->payment_id);
            } else {
                $this->markRefundFailed($refund, $exception->getMessage());
            }

            Log::error('Booking refund processing error', [
                'booking_id' => $booking->id,
                'refund_key' => $refund->refund_key,
                'request_started' => $gatewayRequestStarted,
                'exception' => $exception::class,
            ]);

            return back()->withErrors([
                'refund' => $gatewayRequestStarted
                    ? 'Respons refund belum dapat dipastikan. Periksa status gateway sebelum mencoba kembali.'
                    : 'Refund gagal diproses. Pembayaran tetap tercatat lunas.',
            ]);
        }
    }

    private function isRefundable(Booking $booking): bool
    {
        $booking->loadMissing('payment');
        $payment = $booking->payment;

        if (
            ! $payment
            || $payment->provider !== 'midtrans'
            || ! in_array($payment->payment_status, [PaymentStatus::PAID, PaymentStatus::PARTIALLY_REFUNDED], true)
            || ! in_array(strtolower((string) $payment->transaction_status), ['settlement', 'partial_refund'], true)
            || ! in_array(strtolower((string) $payment->payment_type), ['credit_card', 'gopay', 'shopeepay', 'dana', 'ovo', 'qris', 'kredivo', 'akulaku'], true)
        ) {
            return false;
        }

        if (! in_array($booking->status, [BookingStatus::CONFIRMED, BookingStatus::COMPLETED, BookingStatus::EXPIRED], true)) {
            return false;
        }

        $confirmedTotal = (int) $booking->refunds()->where('status', 'confirmed')->sum('amount');

        return $confirmedTotal < (int) $payment->gross_amount
            && ! $booking->refunds()->where('status', 'requested')->exists();
    }

    private function markRefundFailed(BookingRefund $refund, string $message): void
    {
        DB::transaction(function () use ($refund, $message) {
            $lockedRefund = BookingRefund::query()->lockForUpdate()->findOrFail($refund->id);

            if ($lockedRefund->status === 'confirmed') {
                return;
            }

            $lockedRefund->update([
                'status' => 'failed',
                'error_message' => mb_substr($message, 0, 2000),
            ]);

            $payment = Payment::query()->lockForUpdate()->findOrFail($lockedRefund->payment_id);

            if ($payment->payment_status === PaymentStatus::REFUND_PENDING) {
                $confirmedTotal = (int) BookingRefund::query()
                    ->where('payment_id', $payment->id)
                    ->where('status', 'confirmed')
                    ->sum('amount');
                $payment->payment_status = $confirmedTotal > 0
                    ? PaymentStatus::PARTIALLY_REFUNDED
                    : PaymentStatus::PAID;
                $payment->save();
            }
        });

        app(BookingService::class)->refreshInvoiceAfterRefund($refund->payment_id);
    }

    public function updateFacility(Request $request, Facility $facility)
    {
        $request->merge([
            'booking_price_per_hour' => preg_replace('/\D+/', '', (string) $request->input('booking_price_per_hour', '')),
            'booking_price_per_day' => preg_replace('/\D+/', '', (string) $request->input('booking_price_per_day', '')),
        ]);

        $data = $request->validate([
            'booking_enabled' => ['required', 'boolean'],
            'booking_mode' => ['required', 'in:hourly,daily,both'],
            'booking_price_per_hour' => ['nullable', 'integer', 'min:1', 'required_if:booking_mode,hourly', 'required_if:booking_mode,both'],
            'booking_price_per_day' => ['nullable', 'integer', 'min:1', 'required_if:booking_mode,daily', 'required_if:booking_mode,both'],
            'booking_min_hours' => ['required', 'integer', 'min:1', 'max:12'],
            'booking_operating_start' => ['required', 'date_format:H:i'],
            'booking_operating_end' => ['required', 'date_format:H:i', 'after:booking_operating_start'],
            'booking_buffer_minutes' => ['required', 'integer', 'min:0', 'max:180'],
        ]);

        $facility->update($data);

        return back()->with('success', 'Pengaturan booking fasilitas diperbarui.');
    }
}
