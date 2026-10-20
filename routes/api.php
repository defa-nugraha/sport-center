<?php

use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

// Midtrans calls this endpoint server-to-server. Authentication is performed
// by verifying the signed notification and confirming transaction status with
// Midtrans before changing any local booking/payment state.
Route::post('/payments/midtrans/notification', [PaymentController::class, 'notification'])
    ->middleware('throttle:60,1')
    ->name('payments.midtrans.notification');
