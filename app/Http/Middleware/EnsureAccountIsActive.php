<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    public function handle(Request $request, \Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->is_suspended) {
            return $next($request);
        }

        // A suspended account must lose the current session and remember cookie.
        $user->forceFill(['remember_token' => Str::random(60)])->save();
        Auth::logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Akun ini sedang ditangguhkan.'], 403);
        }

        return redirect()->route('login')
            ->withErrors(['email' => 'Akun Anda sedang ditangguhkan. Hubungi administrator untuk bantuan.']);
    }
}
