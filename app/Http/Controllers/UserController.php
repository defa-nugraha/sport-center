<?php

namespace App\Http\Controllers;

use App\Models\Booking;
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

        return Inertia::render('user/bookings', [
            'bookings' => $bookings,
        ]);
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
