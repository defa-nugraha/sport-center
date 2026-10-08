<?php

namespace App\Http\Controllers;

use App\Jobs\SendBookingCreatedNotification;
use App\Models\Booking;
use App\Models\Facility;
use App\Services\BookingService;
use App\Services\MidtransService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        if (! $request->user()) {
            return redirect()->route('register');
        }

        return Inertia::render('user/booking', [
            'facilities' => Facility::where('published', true)
                ->where('booking_enabled', true)
                ->whereNotNull('booking_price_per_hour')
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'slug',
                    'subtitle',
                    'venue_type',
                    'address',
                    'hero_image',
                    'thumbnail',
                    'booking_price_per_hour',
                    'booking_min_hours',
                ]),
        ]);
    }

    public function create(Request $request, Facility $facility)
    {
        if (! $request->user()) {
            return redirect()->route('register', ['redirect' => url()->current()]);
        }

        abort_unless($facility->published && $facility->booking_enabled, 404);

        return Inertia::render('public/booking', [
            'facility' => $facility,
            'user' => $request->user()->only(['name', 'email']),
        ]);
    }

    public function availability(Request $request, Facility $facility, BookingService $service)
    {
        abort_unless($facility->published && $facility->booking_enabled, 404);

        $minimumMinutes = max(30, (int) $facility->booking_min_hours * 60);

        $data = $request->validate([
            'booking_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_minutes' => ['required', 'integer', 'min:30', 'max:720', 'multiple_of:30', 'min:' . $minimumMinutes],
        ]);

        $start = Carbon::parse($data['booking_date'] . ' ' . $data['start_time']);
        $end = $start->copy()->addMinutes((int) $data['duration_minutes'])->format('H:i:s');

        $service->expireStale($facility->id);

        $conflict = Booking::where('facility_id', $facility->id)
            ->whereDate('booking_date', $data['booking_date'])
            ->whereIn('status', ['PENDING_PAYMENT', 'CONFIRMED'])
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $data['start_time'])
            ->where(fn ($q) => $q->where('status', 'CONFIRMED')->orWhere(fn ($q) => $q->where('status', 'PENDING_PAYMENT')->where('expires_at', '>', now())))
            ->exists();

        return response()->json([
            'available' => ! $conflict,
            'start_time' => $data['start_time'],
            'end_time' => substr($end, 0, 5),
            'price_per_hour' => $facility->booking_price_per_hour,
            'total' => $facility->booking_price_per_hour
                ? (int) round($facility->booking_price_per_hour * ((int) $data['duration_minutes'] / 60))
                : null,
        ]);
    }

    public function store(Request $request, Facility $facility, BookingService $service, MidtransService $midtrans)
    {
        abort_unless($facility->published && $facility->booking_enabled, 404);

        $minimumMinutes = max(30, (int) $facility->booking_min_hours * 60);

        $data = $request->validate([
            'customer_phone' => ['required', 'string', 'max:40'],
            'booking_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration_minutes' => ['required', 'integer', 'min:30', 'max:720', 'multiple_of:30', 'min:' . $minimumMinutes],
        ]);

        $user = $request->user();
        $data['customer_name'] = $user->name;
        $data['customer_email'] = $user->email;

        $booking = null;

        try {
            $booking = $service->create($facility, $data)['booking'];
            $orderId = 'BOOKING-' . $booking->id . '-' . strtoupper(Str::random(8));
            $response = $midtrans->createSnapTransaction([
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $booking->total,
                ],
                'item_details' => [[
                    'id' => 'FAC-' . $facility->id,
                    'price' => $booking->total,
                    'quantity' => 1,
                    'name' => Str::limit($facility->name . ' ' . $booking->duration_minutes . ' menit', 50),
                ]],
                'customer_details' => [
                    'first_name' => $booking->customer_name,
                    'email' => $booking->customer_email,
                    'phone' => $booking->customer_phone,
                ],
                'expiry' => [
                    'unit' => 'minute',
                    'duration' => (int) config('booking.payment_expiry_minutes'),
                ],
                'callbacks' => [
                    'finish' => route('booking.show', ['booking' => $booking->encrypted_id]),
                ],
            ]);
            $payment = $service->attachPayment($booking, $response, $orderId);
            SendBookingCreatedNotification::dispatch($booking->id, $payment->payment_url);

            return redirect()
                ->route('booking.show', $booking)
                ->with('payment_url', $payment->payment_url)
                ->with('success', 'Booking berhasil dibuat. Silakan lakukan pembayaran sebelum batas waktu berakhir.');
        } catch (\Throwable $e) {
            if ($booking) {
                $booking->update([
                    'status' => 'FAILED',
                    'failure_reason' => 'Gagal membuat transaksi pembayaran.',
                ]);
            }

            return back()->withErrors(['booking' => $e->getMessage()])->withInput();
        }
    }

    public function show(Request $request, Booking $booking)
    {
        abort_unless($booking->user_id === $request->user()->id, 403);
        $booking->load(['facility', 'payment', 'invoice']);

        return Inertia::render('public/booking-status', ['booking' => $booking]);
    }
}
