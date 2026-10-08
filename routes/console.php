<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\TeamInvitation;
use App\Services\BookingService;
use Illuminate\Support\Facades\Schedule;

Schedule::call(fn () => app(BookingService::class)->expireStale())
    ->everyMinute()
    ->description('Expire unpaid Sport Center bookings');

Schedule::call(function () {
    Booking::where('status', BookingStatus::CONFIRMED)
        ->where(function ($q) {
            $q->where('booking_date', '<', today())
                ->orWhere(fn ($q) => $q->whereDate('booking_date', today())->where('end_time', '<', now()->format('H:i:s')));
        })
        ->update(['status' => BookingStatus::COMPLETED, 'completed_at' => now()]);
})->everyMinute()->description('Complete finished Sport Center bookings');

Schedule::call(function () {
    TeamInvitation::query()->whereNotNull('expires_at')->where('expires_at', '<', now())->delete();
})->daily()->description('Delete expired team invitations');
