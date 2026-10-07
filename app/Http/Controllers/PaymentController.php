<?php
namespace App\Http\Controllers;
use App\Services\BookingService;use App\Services\MidtransService;use Illuminate\Http\Request;use Illuminate\Support\Facades\Log;
class PaymentController extends Controller{public function notification(Request $request,BookingService $service,MidtransService $midtrans){try{$service->processPaymentNotification($request->all(),$midtrans);return response()->json(['status'=>'ok']);}catch(\Throwable $e){Log::warning('midtrans notification rejected',['error'=>$e->getMessage()]);return response()->json(['message'=>'Invalid notification'],400);}}}
