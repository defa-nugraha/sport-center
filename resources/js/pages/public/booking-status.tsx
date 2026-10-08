import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarCheck, CalendarDays, CheckCircle2, CreditCard, FileText } from 'lucide-react';
import { UserShell } from '@/components/user-layout';
import { BookingStatusBadge, bookingStatusLabels } from '@/components/booking-status-badge';

export default function BookingStatus({ booking }: { booking: any }) {
    const flash = (usePage().props as any).flash ?? {};
    const paymentUrl = flash.payment_url || booking.payment?.payment_url;

    return (
        <UserShell active="bookings" title="Detail Booking" description="Pantau status pemesanan dan pembayaran venue kamu.">
            <div className="booking-status-back"><Link className="button secondary" href="/bookings"><ArrowLeft aria-hidden="true" /> Kembali ke riwayat booking</Link></div>
            <section className="booking-status-hero" aria-labelledby="booking-status-title">
                <div className="booking-status-icon">{booking.status === 'CONFIRMED' ? <CheckCircle2 /> : <CalendarCheck />}</div>
                <div><span className="eyebrow"><i /> {booking.booking_number}</span><BookingStatusBadge status={booking.status} className="booking-status-hero-badge" /><h2 id="booking-status-title">{bookingStatusLabels[booking.status] || booking.status}</h2><p>{booking.status === 'PENDING_PAYMENT' ? 'Selesaikan pembayaran sebelum batas waktu agar slot tetap tersimpan.' : booking.status === 'CONFIRMED' ? 'Pembayaran berhasil dan booking kamu sudah dikonfirmasi.' : 'Status booking ini perlu diperhatikan sebelum melanjutkan.'}</p></div>
                {booking.status === 'PENDING_PAYMENT' && paymentUrl && <a className="button" href={paymentUrl}>Lanjutkan pembayaran</a>}
            </section>
            <div className="booking-status-grid">
                <section className="user-panel"><div className="user-panel-head"><div><span className="eyebrow"><i /> Jadwal</span><h2>{booking.facility.name}</h2></div><CalendarDays /></div><div className="booking-detail-info"><div><span>Jadwal</span><strong>{booking.booking_mode === 'daily' ? `${new Date(booking.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} – ${new Date(booking.booking_end_date || booking.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}` : new Date(booking.booking_date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</strong></div><div><span>Mode</span><strong>{booking.booking_mode === 'daily' ? 'Per hari' : 'Per jam'}</strong></div><div><span>{booking.booking_mode === 'daily' ? 'Jumlah hari' : 'Durasi'}</span><strong>{booking.booking_mode === 'daily' ? Math.max(1, Math.round((new Date(booking.booking_end_date || booking.booking_date).getTime() - new Date(booking.booking_date).getTime()) / 86400000) + 1) + ' hari' : booking.duration_minutes / 60 + ' jam'}</strong></div><div><span>Total</span><strong>Rp {Number(booking.total).toLocaleString('id-ID')}</strong></div></div></section>
                <section className="user-panel"><div className="user-panel-head"><div><span className="eyebrow"><i /> Pembayaran</span><h2>Transaksi</h2><p className="booking-section-helper">Informasi pembayaran dan invoice booking ini.</p></div><CreditCard /></div><div className="booking-detail-info"><div><span>Status pembayaran</span><strong>{booking.payment?.payment_status || '-'}</strong></div><div><span>Order ID</span><strong>{booking.payment?.order_id || '-'}</strong></div><div><span>Invoice</span><strong>{booking.invoice?.invoice_number || 'Belum dibuat'}</strong></div>{booking.expires_at && <div><span>Batas pembayaran</span><strong>{booking.expires_at}</strong></div>}</div></section>
            </div>
            {booking.status === 'CONFIRMED' && booking.invoice && <div className="booking-success-note"><FileText /><span>Invoice {booking.invoice.invoice_number} telah dibuat dan akan dikirim melalui notifikasi yang terdaftar.</span></div>}
            <Link className="booking-back-user" href="/bookings">Kembali ke riwayat booking</Link>
        </UserShell>
    );
}
