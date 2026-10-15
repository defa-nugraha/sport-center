<?php

use App\Services\MidtransService;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.midtrans.server_key' => 'test-server-key',
        'services.midtrans.snap_url' => 'https://snap.test',
        'services.midtrans.api_url' => 'https://api.test',
    ]);
});

it('validates Midtrans notification signatures using the configured server key', function () {
    $notification = [
        'order_id' => 'ORDER-123',
        'status_code' => '200',
        'gross_amount' => '150000.00',
    ];

    $raw = $notification['order_id']
        .$notification['status_code']
        .$notification['gross_amount']
        .config('services.midtrans.server_key');

    $notification['signature_key'] = hash('sha512', $raw);

    expect(app(MidtransService::class)->verifySignature($notification))->toBeTrue();

    $notification['gross_amount'] = '1.00';

    expect(app(MidtransService::class)->verifySignature($notification))->toBeFalse();
});

it('does not expose provider response bodies when transaction creation fails', function () {
    Http::fake([
        'https://snap.test/*' => Http::response(['message' => 'sensitive gateway detail'], 500),
    ]);

    expect(fn () => app(MidtransService::class)->createSnapTransaction([]))
        ->toThrow(RuntimeException::class, 'Payment provider transaction creation failed.');
});

it('does not expose provider response bodies when status verification fails', function () {
    Http::fake([
        'https://api.test/*' => Http::response(['message' => 'sensitive gateway detail'], 503),
    ]);

    expect(fn () => app(MidtransService::class)->getStatus('ORDER-123'))
        ->toThrow(RuntimeException::class, 'Payment provider status verification failed.');
});
