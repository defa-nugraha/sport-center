<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        if ($request->user() instanceof User && $request->user()->is_suspended) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return $request->wantsJson()
                ? new JsonResponse(['message' => 'Akun ini sedang ditangguhkan.'], 403)
                : redirect('/login')->withErrors(['email' => 'Akun Anda sedang ditangguhkan. Hubungi administrator untuk bantuan.']);
        }

        $isAdministrator = $request->user() instanceof User && (
            $request->user()->roles()->where('name', 'administrator')->where('guard_name', 'web')->exists()
            || $request->user()->getAllPermissions()->isNotEmpty()
        );

        $redirect = $isAdministrator ? '/admin' : '/dashboard';

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false, 'redirect' => $redirect], 200)
            : redirect($redirect);
    }
}
