<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Facility;
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
