<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use Symfony\\Component\\HttpFoundation\\Response;

class EnsureAdminAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless(
            $user && (
                $user->roles()->where('name', 'administrator')->where('guard_name', 'web')->exists()
                || $user->getAllPermissions()->isNotEmpty()
            ),
            403,
        );

        return $next($request);
    }
}
