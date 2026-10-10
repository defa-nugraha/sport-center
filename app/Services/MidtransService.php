<?php

namespace App\Services;

use App\Exceptions\MidtransRefundRejectedException;
use App\Exceptions\MidtransRefundUncertainException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MidtransService
{
    private string $snapBase;
    private string $apiBase;
    private string $serverKey;

    public function __construct()
    {
        $this->snapBase = config('services.midtrans.snap_url');
        $this->apiBase = config('services.midtrans.api_url');
        $this->serverKey = (string) config('services.midtrans.server_key');
    }

    public function createSnapTransaction(array $payload): array
    {
        $response = Http::withBasicAuth($this->serverKey, '')
            ->acceptJson()
            ->timeout(15)
            ->post($this->snapBase.'/v1/transactions', $payload);

        if ($response->failed()) {
            throw new RuntimeException('Midtrans transaction creation failed: '.$response->body());
        }

        return $response->json();
    }

    public function getStatus(string $id): array
    {
        $response = Http::withBasicAuth($this->serverKey, '')
            ->acceptJson()
            ->timeout(10)
            ->get($this->apiBase.'/v2/'.rawurlencode($id).'/status');

        if ($response->status() === 404) {
            return [];
        }

        if ($response->failed()) {
            throw new RuntimeException('Midtrans status verification failed: '.$response->body());
        }

        return $response->json();
    }

    /**
     * Request a full transaction refund. A caller-created refund key is persisted
     * before this request so ambiguous gateway timeouts are never blindly retried.
     */
    public function refund(string $transactionIdentifier, string $refundKey, string $reason, int $amount): array
    {
        try {
            $response = Http::withBasicAuth($this->serverKey, '')
                ->acceptJson()
                ->timeout(20)
                ->post($this->apiBase.'/v2/'.rawurlencode($transactionIdentifier).'/refund', [
                    'refund_key' => $refundKey,
                    'amount' => $amount,
                    'reason' => $reason,
                ]);
        } catch (ConnectionException $exception) {
            throw new MidtransRefundUncertainException(
                'Respons Midtrans tidak dapat dipastikan.',
                0,
                $exception,
            );
        }

        if ($response->serverError() || in_array($response->status(), [408, 425, 429], true)) {
            throw new MidtransRefundUncertainException('Respons Midtrans belum dapat dipastikan.');
        }

        if ($response->failed()) {
            throw new MidtransRefundRejectedException(
                (string) ($response->json('status_message') ?: 'Midtrans menolak permintaan refund.'),
            );
        }

        $payload = $response->json() ?? [];
        $gatewayCode = (int) ($payload['status_code'] ?? 0);

        if ($gatewayCode >= 500) {
            throw new MidtransRefundUncertainException(
                (string) ($payload['status_message'] ?? 'Status refund belum dapat dipastikan.'),
            );
        }

        if ($gatewayCode !== 200) {
            throw new MidtransRefundRejectedException(
                (string) ($payload['status_message'] ?? 'Midtrans menolak permintaan refund.'),
            );
        }

        return $payload;
    }

    public function verifySignature(array $notification): bool
    {
        $signature = $notification['signature_key'] ?? '';
        $raw = ($notification['order_id'] ?? '')
            .($notification['status_code'] ?? '')
            .($notification['gross_amount'] ?? '')
            .$this->serverKey;

        return $signature !== '' && hash_equals($signature, hash('sha512', $raw));
    }

    public function isSuccessful(array $status): bool
    {
        $transactionStatus = strtolower((string) ($status['transaction_status'] ?? ''));
        $fraudStatus = strtolower((string) ($status['fraud_status'] ?? ''));

        return in_array($transactionStatus, ['settlement', 'capture'], true)
            && ($fraudStatus === '' || $fraudStatus === 'accept');
    }
}
