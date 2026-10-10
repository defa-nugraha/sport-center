<?php

namespace App\Enums;

enum BookingStatus: string
{
    case PENDING_PAYMENT = 'PENDING_PAYMENT';
    case CONFIRMED = 'CONFIRMED';
    case FAILED = 'FAILED';
    case EXPIRED = 'EXPIRED';
    case CANCELLED = 'CANCELLED';
    case COMPLETED = 'COMPLETED';
    case REFUNDED = 'REFUNDED';
}
