<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()->latest()->paginate(15)->withQueryString();
        $notifications->through(fn ($notification) => [
            'id' => $notification->id,
            'title' => $notification->data['title'] ?? 'Notifikasi',
            'message' => $notification->data['message'] ?? '',
            'url' => $notification->data['url'] ?? '/dashboard',
            'created_at' => $notification->created_at?->diffForHumans(),
            'read_at' => $notification->read_at,
        ]);

        return Inertia::render('user/notifications', [
            'notifications' => $notifications,
        ]);
    }

    public function markRead(Request $request, string $notification)
    {
        $item = $request->user()->notifications()->whereKey($notification)->firstOrFail();
        $item->markAsRead();

        return back()->with('success', 'Notifikasi ditandai sudah dibaca.');
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return back()->with('success', 'Semua notifikasi ditandai sudah dibaca.');
    }
}
