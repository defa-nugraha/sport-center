<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $notificationPreview = fn () => $user ? $user->notifications()->latest()->take(5)->get()->map(fn ($notification) => [
            'id' => $notification->id,
            'title' => $notification->data['title'] ?? 'Notifikasi',
            'message' => $notification->data['message'] ?? '',
            'url' => $notification->data['url'] ?? '/dashboard',
            'created_at' => $notification->created_at?->diffForHumans(),
            'read_at' => $notification->read_at,
        ]) : [];

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'notifications' => [
                'latest' => $notificationPreview,
                'unread_count' => fn () => $user ? $user->unreadNotifications()->count() : 0,
            ],
            'auth' => [
                'user' => $user,
                'permissions' => fn () => $user?->getAllPermissions()->pluck('name')->values() ?? [],
                'roles' => fn () => $user?->getRoleNames()->values() ?? [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
        ];
    }
}
