<?php

use App\\Http\\Middleware\\EnsureAccountIsActive;
use App\\Http\\Middleware\\EnsureAdminAccess;
use App\\Http\\Middleware\\HandleAppearance;
use App\\Http\\Middleware\\HandleInertiaRequests;
use App\\Http\\Middleware\\SetTeamUrlDefaults;
use App\\Http\\Middleware\\TrackPublicVisit;
use Illuminate\\Foundation\\Application;
use Illuminate\\Foundation\\Configuration\\Exceptions;
use Illuminate\\Foundation\\Configuration\\Middleware;
use Illuminate\\Http\\Middleware\\AddLinkHeadersForPreloadedAssets;
use Illuminate\\Http\\Request;
use Illuminate\\Auth\\AuthenticationException;
use Illuminate\\Auth\\Access\\AuthorizationException;
use Illuminate\\Database\\Eloquent\\ModelNotFoundException;
use Illuminate\\Validation\\ValidationException;
use Inertia\\Inertia;
use Spatie\\Permission\\Middleware\\PermissionMiddleware;
use Spatie\\Permission\\Middleware\\RoleMiddleware;
use Symfony\\Component\\HttpKernel\\Exception\\HttpExceptionInterface;
//use Throwable;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust only explicitly configured reverse proxies. For a local
        // Cloudflare Tunnel, loopback is the default; deployments using Docker
        // or another proxy network must set TRUSTED_PROXIES to those proxy IPs.
        $trustedProxies = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('TRUSTED_PROXIES', '127.0.0.1,::1')),
        )));
        $middleware->trustProxies(at: $trustedProxies ?: ['127.0.0.1', '::1']);

        // Server-to-server callbacks use the API middleware stack; browser
        // routes retain normal CSRF protection without endpoint exemptions.

        $middleware->alias([
            'permission' => PermissionMiddleware::class,
            'role' => RoleMiddleware::class,
            'track.public.visit' => TrackPublicVisit::class,
            'admin.access' => EnsureAdminAccess::class,
        ]);
        $middleware->redirectUsersTo(fn (Request $request) => $request->user()?->role === 'admin' ? '/admin' : '/dashboard');
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SetTeamUrlDefaults::class,
            EnsureAccountIsActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (\\Throwable $exception, Request $request) {
            // Keep API responses and Laravel's normal validation flow unchanged.
            if ($request->is('api/*') || $request->expectsJson() || $exception instanceof ValidationException || $exception instanceof AuthenticationException) {
                return null;
            }

            // Render standard HTTP errors (including 404/403/419/429) and a safe
            // generic 500 page for unexpected server exceptions.
            $status = match (true) {
                $exception instanceof AuthorizationException => 403,
                $exception instanceof ModelNotFoundException => 404,
                $exception instanceof HttpExceptionInterface => $exception->getStatusCode(),
                default => 500,
            };

            if ($status < 400 || $status > 599) {
                $status = 500;
            }

            return Inertia::render('errors/error', [
                'status' => $status,
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();
