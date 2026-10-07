import { Link } from '@inertiajs/react';

export default function Show({ booking }: { booking: any }) {
    return (
        <main className="max-w-3xl p-6">
            <Link href="/admin/bookings">← Booking</Link>
            <h1 className="mt-4 text-2xl font-semibold">{booking.booking_number}</h1>
            <div className="mt-6 space-y-2">
                <p>Customer: {booking.customer_name}</p><p>Phone: {booking.customer_phone}</p><p>Facility: {booking.facility.name}</p>
                <p>Schedule: {booking.booking_date} {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</p>
                <p>Booking status: {booking.status}</p><p>Payment status: {booking.payment?.payment_status}</p><p>Midtrans order: {booking.payment?.order_id}</p>
                <p>Invoice: {booking.invoice?.invoice_number ?? '-'}</p><p>Total: Rp {Number(booking.total).toLocaleString('id-ID')}</p>
            </div>
        </main>
    );
}
