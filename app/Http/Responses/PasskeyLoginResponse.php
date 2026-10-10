<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class PasskeyLoginResponse implements PasskeyLoginResponseContract
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

        $redirect = $request->user() instanceof User && $request->user()->role === 'admin'
            ? '/admin'
            : '/dashboard';

        return $request->wantsJson()
            ? new JsonResponse(['redirect' => $redirect], 200)
            : redirect($redirect);
    }
}
