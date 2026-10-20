<?php

use Illuminate\Support\Facades\Route;

test('Midtrans notification uses the API route stack without web CSRF middleware', function () {
    $route = Route::getRoutes()->getByName('payments.midtrans.notification');

    expect($route)->not->toBeNull()
        ->and($route->uri())->toBe('api/payments/midtrans/notification')
        ->and($route->methods())->toContain('POST')
        ->and($route->gatherMiddleware())->toContain('throttle:60,1');
});

test('the old web callback URL is no longer registered', function () {
    $legacyWebRouteExists = collect(Route::getRoutes()->getRoutes())
        ->contains(fn ($route) => $route->uri() === 'payments/midtrans/notification'
            && in_array('POST', $route->methods(), true));

    expect($legacyWebRouteExists)->toBeFalse();
});
