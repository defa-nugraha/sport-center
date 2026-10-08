<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class PasskeyLoginResponse implements PasskeyLoginResponseContract
{
    public function toResponse($request): Response
    {
        $redirect = $request->user() instanceof User && $request->user()->hasRole('user')
            ? '/dashboard'
            : '/admin';

        return $request->wantsJson()
            ? new JsonResponse(['redirect' => $redirect], 200)
            : redirect($redirect);
    }
}
