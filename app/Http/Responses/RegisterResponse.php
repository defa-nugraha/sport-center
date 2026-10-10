<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Symfony\Component\HttpFoundation\Response;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request): Response
    {
        $redirect = $request->session()->pull('url.intended', '/dashboard');

        if ($request->user() && ! $request->user()->hasVerifiedEmail()) {
            $redirect = route('verification.notice');
        }

        return $request->wantsJson()
            ? new JsonResponse(['redirect' => $redirect], 201)
            : redirect($redirect);
    }
}
