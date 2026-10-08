<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Facility;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminBookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['facility', 'payment', 'invoice'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Inertia::render('admin/bookings/index', [
            'bookings' => $query->paginate(20)->withQueryString(),
            'statuses' => array_column(BookingStatus::cases(), 'value'),
            'filters' => $request->only('status'),
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
            ]),
        ]);
    }

    public function show(Booking $booking)
    {
        return Inertia::render('admin/bookings/show', [
            'booking' => $booking->load(['facility', 'payment', 'invoice', 'user']),
        ]);
    }

    public function updateFacility(Request $request, Facility $facility)
    {
        $request->merge([
            'booking_price_per_hour' => preg_replace('/\D+/', '', (string) $request->input('booking_price_per_hour', '')),
            'booking_price_per_day' => preg_replace('/\D+/', '', (string) $request->input('booking_price_per_day', '')),
        ]);

        $data = $request->validate([
            'booking_enabled' => ['required', 'boolean'],
            'booking_mode' => ['required', 'in:hourly,daily'],
            'booking_price_per_hour' => ['required', 'integer', 'min:1'],
            'booking_price_per_day' => ['required', 'integer', 'min:1'],
            'booking_min_hours' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $facility->update($data);

        return back()->with('success', 'Pengaturan booking fasilitas diperbarui.');
    }
}
