<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\BookingRefund;
use App\Models\Facility;
use App\Models\Payment;
use App\Jobs\DispatchBookingNotifications;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use RuntimeException;

class BookingService
{
    public function create(Facility $facility, array $data): array
    {
        return DB::transaction(function () use ($facility, $data) {
            $facility = Facility::whereKey($facility->id)->lockForUpdate()->firstOrFail();

            if (! $facility->published || ! $facility->booking_enabled) {
                throw new RuntimeException('Fasilitas belum tersedia untuk booking.');
            }

            $configuredMode = $facility->booking_mode ?: 'hourly';
            $mode = in_array($configuredMode, ['hourly', 'daily'], true)
                ? $configuredMode
                : ($data['booking_mode'] ?? null);

            if ($configuredMode === 'both') {
                $mode = $data['booking_mode'] ?? null;
                if (! in_array($mode, ['hourly', 'daily'], true)) {
                    throw new RuntimeException('Pilih mode booking per jam atau per hari.');
                }
            }

            if ($mode === 'daily') {
                return $this->createDaily($facility, $data);
            }

            if (! $facility->booking_price_per_hour) {
                throw new RuntimeException('Harga booking per jam belum diatur.');
            }

            $start = Carbon::parse($data['booking_date'] . ' ' . $data['start_time']);
            $duration = (int) $data['duration_minutes'];
            $minimumMinutes = max(30, (int) $facility->booking_min_hours * 60);

            if ($duration < $minimumMinutes) {
                throw new RuntimeException('Durasi booking minimal ' . $facility->booking_min_hours . ' jam.');
            }

            $end = $start->copy()->addMinutes($duration);

            if ($start->isPast()) {
                throw new RuntimeException('Waktu booking harus berada di masa depan.');
            }

            $this->expireStale($facility->id);

            $availableSlot = collect($this->hourlySlots(
                $facility,
                $start->toDateString(),
                $duration
            ))->firstWhere('start_time', $start->format('H:i'));

            if (! $availableSlot) {
                throw new RuntimeException('Slot yang dipilih sudah tidak tersedia atau berada di luar jam operasional.');
            }

            $total = (int) round($facility->booking_price_per_hour * ($duration / 60));

            $booking = Booking::create([
                'user_id' => auth()->id(),
                'facility_id' => $facility->id,
                'booking_mode' => 'hourly',
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'],
                'booking_date' => $start->toDateString(),
                'booking_end_date' => $start->toDateString(),
                'start_time' => $start->format('H:i:s'),
                'end_time' => $end->format('H:i:s'),
                'duration_minutes' => $duration,
                'price_per_hour' => $facility->booking_price_per_hour,
                'price_per_day' => null,
                'subtotal' => $total,
                'total' => $total,
                'status' => BookingStatus::PENDING_PAYMENT,
                'expires_at' => now()->addMinutes(config('booking.payment_expiry_minutes')),
            ]);

            return ['booking' => $booking->fresh('facility'), 'total' => $total];
        });
    }

    /**
     * Return customer-facing hourly start options for a date and duration.
     * A booking blocks its own duration plus the configured turnaround buffer.
     */
    public function hourlySlots(Facility $facility, string $date, int $durationMinutes): array
    {
        $this->expireStale($facility->id);

        $dateValue = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();
        if ($dateValue->lt(Carbon::today())) {
            throw new RuntimeException('Tanggal booking harus berada di masa depan.');
        }

        $minimumMinutes = max(30, (int) $facility->booking_min_hours * 60);
        if ($durationMinutes < $minimumMinutes || $durationMinutes > 720 || $durationMinutes % 30 !== 0) {
            throw new RuntimeException('Durasi booking tidak valid.');
        }

        $opening = Carbon::parse($date . ' ' . ($facility->booking_operating_start ?: '07:00:00'));
        $closing = Carbon::parse($date . ' ' . ($facility->booking_operating_end ?: '22:00:00'));
        if ($closing->lte($opening)) {
            throw new RuntimeException('Jam operasional venue tidak valid.');
        }

        $buffer = max(0, (int) ($facility->booking_buffer_minutes ?? 0));
        $bookings = Booking::where('facility_id', $facility->id)
            ->where(function ($q) use ($date) {
                $q->where(function ($q) use ($date) {
                    $q->where('booking_mode', 'hourly')->whereDate('booking_date', $date);
                })->orWhere(function ($q) use ($date) {
                    $q->where('booking_mode', 'daily')
                        ->whereDate('booking_date', '<=', $date)
                        ->whereDate('booking_end_date', '>=', $date);
                });
            })
            ->whereIn('status', [BookingStatus::CONFIRMED->value, BookingStatus::PENDING_PAYMENT->value])
            ->where(fn ($q) => $q->where('status', BookingStatus::CONFIRMED->value)
                ->orWhere(fn ($q) => $q->where('status', BookingStatus::PENDING_PAYMENT->value)->where('expires_at', '>', now())))
            ->get(['booking_mode', 'booking_date', 'booking_end_date', 'start_time', 'end_time']);

        if ($bookings->contains(fn ($booking) => $booking->booking_mode === 'daily')) {
            return [];
        }

        $blocked = $bookings
            ->filter(fn ($booking) => $booking->booking_mode === 'hourly')
            ->map(function ($booking) use ($date, $buffer) {
                $start = Carbon::parse($date . ' ' . $booking->start_time);
                $end = Carbon::parse($date . ' ' . $booking->end_time)->addMinutes($buffer);
                return [$start, $end];
            })
            ->sortBy(fn ($range) => $range[0]->timestamp)
            ->values();

        $anchors = [$opening->copy()];
        foreach ($blocked as [$blockedStart, $blockedEnd]) {
            if ($blockedEnd->gt($opening) && $blockedEnd->lt($closing)) {
                $anchors[] = $blockedEnd->copy();
            }
        }

        $slots = [];
        foreach ($anchors as $anchor) {
            $candidate = $anchor->copy();
            while ($candidate->lt($closing)) {
                $end = $candidate->copy()->addMinutes($durationMinutes);
                if ($end->gt($closing)) {
                    break;
                }

                if ($dateValue->isToday() && $candidate->lte(now())) {
                    $candidate->addMinutes(15);
                    continue;
                }

                $overlap = false;
                foreach ($blocked as [$blockedStart, $blockedEnd]) {
                    if ($candidate->lt($blockedEnd) && $end->gt($blockedStart)) {
                        $overlap = true;
                        break;
                    }
                }

                if (! $overlap) {
                    $key = $candidate->format('H:i');
                    $slots[$key] = [
                        'start_time' => $key,
                        'end_time' => $end->format('H:i'),
                        'label' => $candidate->format('H.i') . ' - ' . $end->format('H.i'),
                        'total' => $facility->booking_price_per_hour
                            ? (int) round($facility->booking_price_per_hour * ($durationMinutes / 60))
                            : null,
                    ];
                }

                $candidate->addMinutes(15);
            }
        }

        ksort($slots);
        return array_values($slots);
    }

    private function createDaily(Facility $facility, array $data): array
    {
        if (! $facility->booking_price_per_day) {
            throw new RuntimeException('Harga booking per hari belum diatur.');
        }

        $startDate = Carbon::parse($data['booking_date'])->startOfDay();
        $endDate = Carbon::parse($data['booking_end_date'] ?? $data['booking_date'])->startOfDay();

        if ($startDate->lt(Carbon::today())) {
            throw new RuntimeException('Tanggal booking harus berada di masa depan.');
        }

        if ($endDate->lt($startDate)) {
            throw new RuntimeException('Tanggal selesai harus sama atau setelah tanggal mulai.');
        }

        $days = $startDate->diffInDays($endDate) + 1;
        $this->expireStale($facility->id);

        $conflict = Booking::where('facility_id', $facility->id)
            ->whereIn('status', [BookingStatus::CONFIRMED->value, BookingStatus::PENDING_PAYMENT->value])
            ->whereDate('booking_date', '<=', $endDate->toDateString())
            ->whereDate('booking_end_date', '>=', $startDate->toDateString())
            ->where(fn ($q) => $q->where('status', BookingStatus::CONFIRMED->value)
                ->orWhere(fn ($q) => $q->where('status', BookingStatus::PENDING_PAYMENT->value)->where('expires_at', '>', now())))
            ->exists();

        if ($conflict) {
            throw new RuntimeException('Sebagian rentang tanggal yang dipilih sudah tidak tersedia.');
        }

        $total = (int) $facility->booking_price_per_day * $days;

        $booking = Booking::create([
            'user_id' => auth()->id(),
            'facility_id' => $facility->id,
            'booking_mode' => 'daily',
            'customer_name' => $data['customer_name'],
            'customer_email' => $data['customer_email'],
            'customer_phone' => $data['customer_phone'],
            'booking_date' => $startDate->toDateString(),
            'booking_end_date' => $endDate->toDateString(),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'duration_minutes' => $days * 1440,
            'price_per_hour' => 0,
            'price_per_day' => $facility->booking_price_per_day,
            'subtotal' => $total,
            'total' => $total,
            'status' => BookingStatus::PENDING_PAYMENT,
            'expires_at' => now()->addMinutes(config('booking.payment_expiry_minutes')),
        ]);

        return ['booking' => $booking->fresh('facility'), 'total' => $total];
    }

    public function attachPayment(Booking $booking, array $m, string $orderId): Payment
    {
        return $booking->payment()->create([
            'order_id' => $orderId,
            'gross_amount' => $booking->total,
            'payment_status' => PaymentStatus::PENDING,
            'payment_url' => $m['redirect_url'] ?? null,
            'snap_token' => $m['token'] ?? null,
            'metadata' => $m,
        ]);
    }

    public function expireStale(?int $facilityId = null): int
    {
        $q = Booking::where('status', BookingStatus::PENDING_PAYMENT)->where('expires_at', '<=', now());
        if ($facilityId) $q->where('facility_id', $facilityId);
        return $q->update(['status' => Boo    public function processPaymentNotification(array $n, MidtransService $midtrans): void
    {
        $payment = Payment::where('order_id', $n['order_id'] ?? '')->firstOrFail();

        if (! $midtrans->verifySignature($n)) {
            throw new RuntimeException('Invalid Midtrans signature.');
        }

        $gatewayStatus = $midtrans->getStatus($payment->order_id);
        $status = $gatewayStatus ?: $n;

        if (($status['order_id'] ?? null) !== $payment->order_id) {
            throw new RuntimeException('Midtrans order ID mismatch.');
        }
        if (strtoupper((string) ($status['currency'] ?? 'IDR')) !== 'IDR') {
            throw new RuntimeException('Midtrans currency mismatch.');
        }
        if ((int) round((float) ($status['gross_amount'] ?? -1)) !== $payment->gross_amount) {
            throw new RuntimeException('Midtrans gross amount mismatch.');
        }

        $notificationTransactionStatus = strtolower((string) ($n['transaction_status'] ?? ''));
        if (in_array($notificationTransactionStatus, ['refund', 'partial_refund'], true)) {
            // A signed refund notification may include bank-confirmation details
            // not included in the status endpoint response, so merge its fields.
            $status = array_merge($status, $n);
        }

        $transactionStatus = strtolower((string) ($status['transaction_status'] ?? ''));
        if (in_array($transactionStatus, ['refund', 'partial_refund'], true)) {
            $this->syncRefundStatus($payment, $status);

            return;
        }

        // A delayed settlement notification must never undo an active/completed refund.
        if (in_array($payment->payment_status, [
            PaymentStatus::REFUND_PENDING,
            PaymentStatus::PARTIALLY_REFUNDED,
            PaymentStatus::REFUNDED,
        ], true)) {
            return;
        }

        if ($payment->payment_status === PaymentStatus::PAID
            && $payment->booking?->status === BookingStatus::CONFIRMED) {
            return;
        }

        DB::transaction(function () use ($payment, $status, $midtrans) {
            $payment = Payment::lockForUpdate()->findOrFail($payment->id);
            $booking = Booking::lockForUpdate()->findOrFail($payment->booking_id);
            $payment->fill([
                'transaction_id' => $status['transaction_id'] ?? $payment->transaction_id,
                'payment_type' => $status['payment_type'] ?? $payment->payment_type,
                'transaction_status' => $status['transaction_status'] ?? null,
                'fraud_status' => $status['fraud_status'] ?? null,
                'metadata' => $status,
            ]);

            if ($midtrans->isSuccessful($status)) {
                if ($booking->status === BookingStatus::CONFIRMED) {
                    $payment->payment_status = PaymentStatus::PAID;
                    $payment->paid_at ??= now();
                    $payment->save();

                    return;
                }

                if ($booking->expires_at?->isPast()) {
                    $booking->update([
                        'status' => BookingStatus::EXPIRED,
                        'failure_reason' => 'Pembayaran diterima setelah hold booking berakhir.',
                    ]);
                    $payment->payment_status = PaymentStatus::EXPIRED;
                    $payment->save();

                    return;
                }

                $booking->update([
                    'status' => BookingStatus::CONFIRMED,
                    'paid_at' => now(),
                    'expires_at' => null,
                ]);
                $payment->payment_status = PaymentStatus::PAID;
                $payment->paid_at = now();
                $payment->save();
            } elseif (strtolower((string) ($status['transaction_status'] ?? '')) === 'expire') {
                $booking->update(['status' => BookingStatus::EXPIRED]);
                $payment->payment_status = PaymentStatus::EXPIRED;
                $payment->expired_at = now();
                $payment->save();
            } elseif (in_array(strtolower((string) ($status['transaction_status'] ?? '')), ['deny', 'cancel', 'failure'], true)) {
                $booking->update([
                    'status' => BookingStatus::FAILED,
                    'failure_reason' => $status['status_message'] ?? 'Pembayaran gagal.',
                ]);
                $payment->payment_status = PaymentStatus::FAILED;
                $payment->save();
            } else {
                $payment->payment_status = PaymentStatus::PENDING;
                $payment->save();
            }
        });

        $booking = Booking::with(['facility', 'payment', 'invoice'])->find($payment->booking_id);

        if ($booking?->status === BookingStatus::CONFIRMED && ! $booking->invoice) {
            app(InvoiceService::class)->create($booking);
        }
        if ($booking?->invoice && $booking->status === BookingStatus::CONFIRMED) {
            DispatchBookingNotifications::dispatch($booking->id);
        }
    }

    /**
     * Only release the booked slot when the gateway sends bank confirmation.
     */
    public function syncRefundStatus(Payment $payment, array $status): void
    {
        $transactionStatus = strtolower((string) ($status['transaction_status'] ?? ''));
        if (! in_array($transactionStatus, ['refund', 'partial_refund'], true)) {
            return;
        }

        $entries = collect(is_array($status['refunds'] ?? null) ? $status['refunds'] : []);
        $confirmedEntries = $entries
            ->filter(fn (array $entry) => ! empty($entry['bank_confirmed_at']))
            ->values();

        if ($confirmedEntries->isEmpty() && ! empty($status['bank_confirmed_at'])) {
            $confirmedEntries = collect([$status]);
        }

        if ($confirmedEntries->isEmpty()) {
            DB::transaction(function () use ($payment, $status) {
                $lockedPayment = Payment::lockForUpdate()->findOrFail($payment->id);
                $lockedPayment->payment_status = PaymentStatus::REFUND_PENDING;
                $lockedPayment->transaction_status = $status['transaction_status'] ?? $lockedPayment->transaction_status;
                $lockedPayment->metadata = array_merge(
                    (array) $lockedPayment->metadata,
                    ['latest_refund_status' => $status],
                );
                $lockedPayment->save();

                $pendingRefund = BookingRefund::query()
                    ->where('payment_id', $lockedPayment->id)
                    ->where('status', 'requested')
                    ->latest('id')
                    ->lockForUpdate()
                    ->first();

                if ($pendingRefund) {
                    $pendingRefund->gateway_response = $status;
                    $pendingRefund->save();
                }
            });

            return;
        }

        DB::transaction(function () use ($payment, $status, $confirmedEntries, $transactionStatus) {
            $lockedPayment = Payment::lockForUpdate()->findOrFail($payment->id);
            $booking = Booking::lockForUpdate()->findOrFail($lockedPayment->booking_id);

            foreach ($confirmedEntries as $entry) {
                $refundKey = (string) ($entry['refund_key'] ?? $status['refund_key'] ?? '');
                $refundQuery = BookingRefund::query()->where('payment_id', $lockedPayment->id);

                if ($refundKey !== '') {
                    $refundQuery->where('refund_key', $refundKey);
                }

                $refund = $refundQuery->lockForUpdate()->first();
                if (! $refund) {
                    $refund = BookingRefund::query()
                        ->where('payment_id', $lockedPayment->id)
                        ->where('status', 'requested')
                        ->latest('id')
                        ->lockForUpdate()
                        ->first();
                }

                $confirmedAmount = (int) round((float) ($entry['refund_amount'] ?? $status['refund_amount'] ?? 0));

                if (! $refund) {
                    $generatedKey = $refundKey !== ''
                        ? $refundKey
                        : 'MIDTRANS-'.strtoupper(\Illuminate\Support\Str::random(16));
                    $refund = BookingRefund::create([
                        'booking_id' => $booking->id,
                        'payment_id' => $lockedPayment->id,
                        'admin_user_id' => null,
                        'refund_key' => $generatedKey,
                        'amount' => $confirmedAmount > 0 ? $confirmedAmount : $lockedPayment->gross_amount,
                        'reason' => 'Refund dikonfirmasi langsung oleh Midtrans.',
                        'status' => 'requested',
                        'requested_at' => now(),
                    ]);
                }

                $refund->update([
                    'amount' => $confirmedAmount > 0 ? $confirmedAmount : $refund->amount,
                    'status' => 'confirmed',
                    'gateway_response' => $status,
                    'error_message' => null,
                    'confirmed_at' => ! empty($entry['bank_confirmed_at'])
                        ? Carbon::parse($entry['bank_confirmed_at'])
                        : Carbon::parse($status['bank_confirmed_at']),
                ]);
            }

            $confirmedTotal = (int) BookingRefund::query()
                ->where('payment_id', $lockedPayment->id)
                ->where('status', 'confirmed')
                ->sum('amount');

            $lockedPayment->transaction_status = $status['transaction_status'] ?? $lockedPayment->transaction_status;
            $lockedPayment->metadata = array_merge(
                (array) $lockedPayment->metadata,
                ['latest_refund_status' => $status],
            );

            if ($confirmedTotal >= $lockedPayment->gross_amount) {
                $lockedPayment->payment_status = PaymentStatus::REFUNDED;
                $booking->update(['status' => BookingStatus::REFUNDED, 'expires_at' => null]);
            } else {
                $lockedPayment->payment_status = PaymentStatus::PARTIALLY_REFUNDED;
            }

            $lockedPayment->save();
        });
    }:dispatch($booking->id);
    }
}
