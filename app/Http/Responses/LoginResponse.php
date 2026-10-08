<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $redirect = $request->user() instanceof User && $request->user()->getAllPermissions()->isNotEmpty()
            ? '/admin'
            : '/dashboard';

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false, 'redirect' => $redirect], 200)
            : redirect($redirect);
    }
}
