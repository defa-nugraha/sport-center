<?php

namespace App\Services;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
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

            $mode = $facility->booking_mode ?: 'hourly';

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

            $conflict = Booking::where('facility_id', $facility->id)
                ->where('booking_mode', 'hourly')
                ->whereDate('booking_date', $start->toDateString())
                ->whereIn('status', [BookingStatus::CONFIRMED->value, BookingStatus::PENDING_PAYMENT->value])
                ->where('start_time', '<', $end->format('H:i:s'))
                ->where('end_time', '>', $start->format('H:i:s'))
                ->where(fn ($q) => $q->where('status', BookingStatus::CONFIRMED->value)
                    ->orWhere(fn ($q) => $q->where('status', BookingStatus::PENDING_PAYMENT->value)->where('expires_at', '>', now())))
                ->exists();

            if ($conflict) {
                throw new RuntimeException('Slot yang dipilih sudah tidak tersedia.');
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
            ->where('booking_mode', 'daily')
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
        return $q->update(['status' => BookingStatus::EXPIRED]);
    }

    public function processPaymentNotification(array $n, MidtransService $midtrans): void
    {
        $payment = Payment::where('order_id', $n['order_id'] ?? '')->firstOrFail();
        if (! $midtrans->verifySignature($n)) throw new RuntimeException('Invalid Midtrans signature.');
        if ($payment->payment_status === PaymentStatus::PAID && $payment->booking?->status === BookingStatus::CONFIRMED) return;
        $status = $midtrans->getStatus($payment->order_id) ?: $n;
        if (($status['order_id'] ?? null) !== $payment->order_id) throw new RuntimeException('Midtrans order ID mismatch.');
        if (strtoupper((string) ($status['currency'] ?? 'IDR')) !== 'IDR') throw new RuntimeException('Midtrans currency mismatch.');
        if ((int) round((float) ($status['gross_amount'] ?? -1)) !== $payment->gross_amount) throw new RuntimeException('Midtrans gross amount mismatch.');

        DB::transaction(function () use ($payment, $status, $midtrans) {
            $payment = Payment::lockForUpdate()->findOrFail($payment->id);
            $booking = Booking::lockForUpdate()->findOrFail($payment->booking_id);
            $payment->fill(['transaction_id'=>$status['transaction_id']??$payment->transaction_id,'payment_type'=>$status['payment_type']??$payment->payment_type,'transaction_status'=>$status['transaction_status']??null,'fraud_status'=>$status['fraud_status']??null,'metadata'=>$status]);

            if ($midtrans->isSuccessful($status)) {
                if ($booking->status === BookingStatus::CONFIRMED) { $payment->payment_status=PaymentStatus::PAID; $payment->paid_at??=now(); $payment->save(); return; }
                if ($booking->expires_at?->isPast()) { $booking->update(['status'=>BookingStatus::EXPIRED,'failure_reason'=>'Pembayaran diterima setelah hold booking berakhir.']); $payment->payment_status=PaymentStatus::EXPIRED; $payment->save(); return; }
                $booking->update(['status'=>BookingStatus::CONFIRMED,'paid_at'=>now(),'expires_at'=>null]);
                $payment->payment_status=PaymentStatus::PAID; $payment->paid_at=now(); $payment->save();
            } elseif (strtolower((string) ($status['transaction_status']??'')) === 'expire') {
                $booking->update(['status'=>BookingStatus::EXPIRED]); $payment->payment_status=PaymentStatus::EXPIRED; $payment->expired_at=now(); $payment->save();
            } elseif (in_array(strtolower((string) ($status['transaction_status']??'')), ['deny','cancel','failure'], true)) {
                $booking->update(['status'=>BookingStatus::FAILED,'failure_reason'=>$status['status_message']??'Pembayaran gagal.']); $payment->payment_status=PaymentStatus::FAILED; $payment->save();
            } else {
                $payment->payment_status=PaymentStatus::PENDING; $payment->save();
            }
        });

        $booking=Booking::with(['facility','payment','invoice'])->find($payment->booking_id);
        if($booking?->status===BookingStatus::CONFIRMED&&!$booking->invoice)app(InvoiceService::class)->create($booking);
        if($booking?->invoice&&$booking->status===BookingStatus::CONFIRMED)DispatchBookingNotifications::dispatch($booking->id);
    }
}
