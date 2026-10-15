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
            ->with(['facility', 'payment', 'invoice'])
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
            'canRefund' => $request->user()?->hasRole('administrator') && $this->isRefundable($booking),
        ]);
    }

    public function refund(Request $request, Booking $booking, MidtransService $midtrans, BookingService $bookingService)
    {
        abort_unless($request->user()?->hasRole('administrator'), 403);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:255'],
        ]);

        $refund = DB::transaction(function () use ($booking, $request, $data) {
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            $payment = Payment::query()
                ->where('booking_id', $lockedBooking->id)
                ->lockForUpdate()
                ->first();

            if (! $payment || ! $this->isRefundable($lockedBooking->loadMissing('payment'))) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'refund' => 'Booking tidak memenuhi syarat refund penuh. Pembayaran harus lunas dan transaksi harus berstatus settlement atau capture.',
                ]);
            }

            $alreadyRefunded = BookingRefund::query()
                ->where('booking_id', $lockedBooking->id)
                ->whereIn('status', ['requested', 'confirmed'])
                ->exists();

            if ($alreadyRefunded) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'refund' => 'Refund untuk booking ini sedang diproses atau sudah dikonfirmasi.',
                ]);
            }

            $refund = BookingRefund::create([
                'booking_id' => $lockedBooking->id,
                'payment_id' => $payment->id,
                'admin_user_id' => $request->user()->id,
                'refund_key' => 'GGM-REFUND-'.$lockedBooking->id.'-'.Str::upper(Str::random(10)),
                'amount' => $payment->gross_amount,
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
                || ! in_array(strtolower((string) ($gatewayStatus['transaction_status'] ?? '')), ['settlement', 'capture'], true)
                || strtoupper((string) ($gatewayStatus['currency'] ?? 'IDR')) !== 'IDR'
                || (int) round((float) ($gatewayStatus['gross_amount'] ?? -1)) !== $payment->gross_amount
            ) {
                throw new MidtransRefundRejectedException('Status transaksi Midtrans tidak lagi memenuhi syarat refund.');
            }

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
                    : 'Permintaan refund penuh diteruskan ke Midtrans. Jadwal tetap diblokir sampai gateway mengonfirmasi refund.',
            );
        } catch (MidtransRefundRejectedException $exception) {
            $this->markRefundFailed($refund, $exception->getMessage());

            Log::warning('Midtrans refund rejected', [
                'booking_id' => $booking->id,
                'refund_key' => $refund->refund_key,
                'message' => $exception->getMessage(),
            ]);

            return back()->withErrors(['refund' => 'Midtrans menolak refund. Pembayaran tetap tercatat lunas.']);
        } catch (MidtransRefundUncertainException $exception) {
            $refund->update(['error_message' => 'Respons gateway belum dapat dipastikan; menunggu rekonsiliasi.']);

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
            || $payment->payment_status !== PaymentStatus::PAID
            || ! in_array(strtolower((string) $payment->transaction_status), ['settlement', 'capture'], true)
        ) {
            return false;
        }

        if (! in_array($booking->status, [BookingStatus::CONFIRMED, BookingStatus::COMPLETED, BookingStatus::EXPIRED], true)) {
            return false;
        }

        return ! $booking->refunds()->whereIn('status', ['requested', 'confirmed'])->exists();
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
                $payment->payment_status = PaymentStatus::PAID;
                $payment->save();
            }
        });
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
