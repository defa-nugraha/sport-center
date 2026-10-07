import { Head, Link, usePage } from '@inertiajs/react';

export default function BookingStatus({ booking }: { booking: any }) {
    const flash = (usePage().props as any).flash ?? {};
    const paymentUrl = flash.payment_url || booking.payment?.payment_url;

    return (
        <>
            <Head title={'Booking ' + booking.booking_number} />
            <main className="mx-auto max-w-2xl px-6 py-12">
                <h1 className="text-3xl font-semibold">Booking {booking.booking_number}</h1>
                <div className="mt-6 space-y-2 rounded border p-6">
                    <p><b>Fasilitas:</b> {booking.facility.name}</p>
                    <p><b>Tanggal:</b> {booking.booking_date}</p>
                    <p><b>Jam:</b> {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</p>
                    <p><b>Status:</b> {booking.status}</p>
                    <p><b>Total:</b> Rp {Number(booking.total).toLocaleString('id-ID')}</p>
                    {booking.expires_at && <p><b>Batas pembayaran:</b> {booking.expires_at}</p>}
                </div>
                {booking.status === 'PENDING_PAYMENT' && paymentUrl && <a className="mt-6 inline-block rounded bg-black px-5 py-3 text-white" href={paymentUrl}>Lanjutkan Pembayaran</a>}
                {booking.status === 'CONFIRMED' && booking.invoice && <p className="mt-6 text-green-700">Pembayaran berhasil. Invoice {booking.invoice.invoice_number} telah dibuat dan dikirim.</p>}
                <Link className="mt-6 block" href="/facilities">Kembali ke fasilitas</Link>
            </main>
        </>
    );
}
