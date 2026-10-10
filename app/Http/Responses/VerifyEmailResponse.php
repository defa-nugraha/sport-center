<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;
use Symfony\Component\HttpFoundation\Response;

class VerifyEmailResponse implements VerifyEmailResponseContract
{
    public function toResponse($request): Response
    {
        $redirect = $request->user() && (\n            $request->user()->roles()->where('name', 'administrator')->where('guard_name', 'web')->exists()\n            || $request->user()->getAllPermissions()->isNotEmpty()\n        )
            ? '/admin?verified=1'
            : '/dashboard?verified=1';

        return $request->wantsJson()
            ? new JsonResponse(['redirect' => $redirect], 200)
            : redirect($redirect);
    }
}
