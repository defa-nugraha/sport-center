<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingRefund;
use App\Models\BookingRefundRequest;
use App\Models\Testimonial;
use App\Enums\PaymentStatus;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class UserController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $bookings = Booking::with(['facility', 'payment', 'invoice'])
            ->where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('user/dashboard', [
            'user' => $user->only(['id', 'name', 'email']),
            'stats' => [
                'total' => Booking::where('user_id', $user->id)->count(),
                'upcoming' => Booking::where('user_id', $user->id)
                    ->whereDate('booking_date', '>=', now()->toDateString())
                    ->whereIn('status', ['PENDING_PAYMENT', 'CONFIRMED'])
                    ->count(),
                'confirmed' => Booking::where('user_id', $user->id)
                    ->where('status', 'CONFIRMED')
                    ->count(),
            ],
            'bookings' => $bookings,
        ]);
    }

    public function history(Request $request)
    {
        $bookings = Booking::with(['facility', 'payment', 'invoice'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $bookings->getCollection()->transform(function (Booking $booking) {
            $booking->setAttribute('review', Testimonial::where('booking_id', $booking->id)->first());
            $booking->setAttribute('can_review', $this->canReviewBooking($booking));
            $refundRequest = BookingRefundRequest::query()
                ->where('booking_id', $booking->id)
                ->latest('id')
                ->first();
            $booking->setAttribute('refund_request_status', $refundRequest?->status);
            $booking->setAttribute('can_request_refund', $this->canRequestRefund($booking) && $refundRequest?->status !== 'pending');
            $booking->setAttribute(
                'invoice_print_url',
                $booking->invoice
                    ? URL::temporarySignedRoute(
                        'invoices.print',
                        now()->addDays(30),
                        ['invoice' => $booking->invoice->uuid],
                    )
                    : null,
            );

            return $booking;
        });

        return Inertia::render('user/bookings', [
            'bookings' => $bookings,
        ]);
    }


    public function requestRefund(Request $request, Booking $booking)
    {
        abort_unless((int) $booking->user_id === (int) $request->user()->id, 404);

        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        \\Illuminate\\Support\\Facades\\DB::transaction(function () use ($booking, $request, $data) {
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
            abort_unless((int) $lockedBooking->user_id === (int) $request->user()->id, 404);
            $lockedBooking->load('payment');

            if (! $this->canRequestRefund($lockedBooking)) {
                throw ValidationException::withMessages([
                    'refund' => 'Pengajuan refund hanya tersedia untuk pembayaran berhasil yang masih memenuhi ketentuan refund.',
                ]);
            }

            $pendingRequest = BookingRefundRequest::query()
                ->where('booking_id', $lockedBooking->id)
                ->where('status', 'pending')
                ->exists();
            $gatewayRefundPending = BookingRefund::query()
                ->where('booking_id', $lockedBooking->id)
                ->where('status', 'requested')
                ->exists();

            if ($pendingRequest || $gatewayRefundPending) {
                throw ValidationException::withMessages([
                    'refund' => 'Sudah ada pengajuan atau proses refund yang masih berjalan untuk booking ini.',
                ]);
            }

            BookingRefundRequest::create([
                'booking_id' => $lockedBooking->id,
                'user_id' => $request->user()->id,
                'status' => 'pending',
                'reason' => $data['reason'] ?? null,
            ]);
        });

        return back()->with('success', 'Pengajuan refund berhasil dikirim ke admin untuk ditinjau. Nominal akan ditentukan admin sesuai kebijakan refund.');
    }

    private function canRequestRefund(Booking $booking): bool
    {
        $booking->loadMissing('payment');
        $payment = $booking->payment;
        $paymentStatus = $payment?->payment_status;
        if ($paymentStatus instanceof PaymentStatus) {
            $paymentStatus = $paymentStatus->value;
        }

        return $payment
            && $payment->provider === 'midtrans'
            && in_array($paymentStatus, [PaymentStatus::PAID->value, PaymentStatus::PARTIALLY_REFUNDED->value], true)
            && in_array(strtolower((string) $payment->transaction_status), ['settlement', 'partial_refund'], true)
            && ! in_array(($booking->status?->value ?? $booking->status), ['REFUNDED', 'CANCELLED', 'FAILED', 'EXPIRED'], true)
            && (int) BookingRefund::query()->where('payment_id', $payment->id)->where('status', 'confirmed')->sum('amount') < (int) $payment->gross_amount;
    }

    public function storeReview(Request $request, Booking $booking)
    {
        abort_unless((int) $booking->user_id === (int) $request->user()->id, 404);

        if (! $this->canReviewBooking($booking)) {
            throw ValidationException::withMessages([
                'review' => 'Ulasan hanya dapat diberikan setelah booking dibayar dan waktu penggunaan selesai.',
            ]);
        }

        if (Testimonial::where('booking_id', $booking->id)->exists()) {
            throw ValidationException::withMessages([
                'review' => 'Anda sudah memberikan ulasan untuk booking ini.',
            ]);
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'review' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        Testimonial::create([
            'booking_id' => $booking->id,
            'user_id' => $request->user()->id,
            'name' => $request->user()->name,
            'organization' => null,
            'rating' => $data['rating'],
            'review' => $data['review'],
            'status' => 'pending',
            'approved' => false,
        ]);

        return back()->with('success', 'Terima kasih! Ulasan Anda dikirim dan menunggu moderasi admin.');
    }

    private function canReviewBooking(Booking $booking): bool
    {
        $booking->loadMissing('payment');

        $paymentStatus = $booking->payment?->payment_status;
        if ($paymentStatus instanceof PaymentStatus) {
            $paymentStatus = $paymentStatus->value;
        }

        if ($paymentStatus !== PaymentStatus::PAID->value || in_array($booking->status?->value ?? $booking->status, ['REFUNDED', 'CANCELLED', 'FAILED', 'EXPIRED'], true)) {
            return false;
        }

        if (($booking->status?->value ?? $booking->status) === 'COMPLETED') {
            return true;
        }

        if (($booking->booking_mode ?? 'hourly') === 'daily') {
            $end = Carbon::parse(($booking->booking_end_date ?? $booking->booking_date)->toDateString())->endOfDay();
        } else {
            if (! $booking->end_time) {
                return false;
            }

            $end = Carbon::parse($booking->booking_date->toDateString().' '.$booking->end_time);
        }

        return $end->isPast();
    }

    public function profile(Request $request)
    {
        return Inertia::render('user/profile', [
            'user' => $request->user()->only(['id', 'name', 'email']),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($data);

        return back()->with('success', 'Profil berhasil diperbarui.');
    }
}
