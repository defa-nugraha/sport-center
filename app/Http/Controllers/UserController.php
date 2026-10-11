<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Testimonial;
use App\Enums\PaymentStatus;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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

            return $booking;
        });

        return Inertia::render('user/bookings', [
            'bookings' => $bookings,
        ]);
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
