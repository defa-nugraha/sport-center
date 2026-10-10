<?php

namespace App\Observers;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Support\Str;

class BookingNotificationObserver
{
    public function created(Booking $booking): void
    {
        $booking->loadMissing('facility');

        $this->notifyAdministrators(
            'transaksi_baru',
            'Transaksi booking baru',
            ($booking->customer_name ?: 'Pengguna') . ' membuat booking ' . $booking->booking_number . '.',
            '/admin/bookings/' . $booking->getRouteKey(),
            $booking,
        );

        if ($booking->user) {
            $this->notify(
                $booking->user,
                'booking_dibuat',
                'Booking berhasil dibuat',
                'Booking ' . $booking->booking_number . ' menunggu pembayaran.',
                '/bookings',
                $booking,
            );
        }
    }

    public function updated(Booking $booking): void
    {
        if (! $booking->wasChanged('status')) {
            return;
        }

        $booking->loadMissing(['facility', 'user']);
        $status = $booking->status instanceof \BackedEnum ? $booking->status->value : (string) $booking->status;
        $message = 'Status booking ' . $booking->booking_number . ' berubah menjadi ' . str_replace('_', ' ', strtolower($status)) . '.';

        if ($booking->user) {
            $this->notify($booking->user, 'status_booking', 'Pembaruan transaksi', $message, '/bookings', $booking);
        }

        $this->notifyAdministrators('status_booking', 'Status transaksi diperbarui', $message, '/admin/bookings/' . $booking->getRouteKey(), $booking);
    }

    private function notifyAdministrators(string $type, string $title, string $message, string $url, Booking $booking): void
    {
        User::whereHas('roles', fn ($query) => $query->where('name', 'administrator')->where('guard_name', 'web'))->get()->each(
            fn (User $admin) => $this->notify($admin, $type, $title, $message, $url, $booking)
        );
    }

    private function notify(User $user, string $type, string $title, string $message, string $url, Booking $booking): void
    {
        $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\TransactionNotification',
            'data' => [
                'kind' => $type,
                'title' => $title,
                'message' => $message,
                'url' => $url,
                'booking_id' => $booking->getKey(),
                'booking_number' => $booking->booking_number,
                'facility' => $booking->facility?->name,
            ],
        ]);
    }
}
