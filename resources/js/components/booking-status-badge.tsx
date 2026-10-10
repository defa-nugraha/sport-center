import type { HTMLAttributes } from 'react';

export const bookingStatusLabels: Record<string, string> = {
    PENDING_PAYMENT: 'Menunggu pembayaran',
    CONFIRMED: 'Dikonfirmasi',
    FAILED: 'Gagal',
    EXPIRED: 'Kedaluwarsa',
    CANCELLED: 'Dibatalkan',
    COMPLETED: 'Selesai',
    REFUNDED: 'Refund selesai',
};

export const bookingStatusClasses: Record<string, string> = {
    PENDING_PAYMENT: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    REFUNDED: 'refunded',
};

export function BookingStatusBadge({
    status,
    className = '',
    ...props
}: { status?: string | null; className?: string } & HTMLAttributes<HTMLSpanElement>) {
    const normalized = status || 'UNKNOWN';
    const label = bookingStatusLabels[normalized] || normalized;
    const variant = bookingStatusClasses[normalized] || 'unknown';

    return (
        <span
            className={`booking-status ${variant} ${className}`.trim()}
            {...props}
        >
            <span className="booking-status-dot" aria-hidden="true" />
            {label}
        </span>
    );
}
