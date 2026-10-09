import { Link } from '@inertiajs/react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { UserShell } from '@/components/user-layout';

const formatBookingDate = (value?: string | null) => {
    if (!value) return 'Tanggal belum tersedia';
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

const statusLabels: Record<string, string> = { PENDING_PAYMENT: 'Menunggu pembayaran', CONFIRMED: 'Dikonfirmasi', FAILED: 'Gagal', EXPIRED: 'Kedaluwarsa', CANCELLED: 'Dibatalkan', COMPLETED: 'Selesai' };

export default function Bookings({ bookings }: any) {
    return (
        <UserShell active="bookings" title="Riwayat Booking" description="Lihat seluruh pemesanan venue dan status pembayaran kamu.">
            <section className="user-panel">
                {bookings.data.length ? <div className="user-history-list">{bookings.data.map((booking: any) => {
                    const isDaily = (booking.booking_mode || 'hourly') === 'daily';
                    return (
                        <article className="user-history-card" key={booking.id}>
                            <div className="user-history-main">
                                <div className="user-booking-icon"><CalendarDays /></div>
                                <div>
                                    <span className="eyebrow"><i /> {booking.booking_number}</span>
                                    <h3>{booking.facility?.name}</h3>
                                    <p>{isDaily ? `${formatBookingDate(booking.booking_date)} – ${formatBookingDate(booking.booking_end_date || booking.booking_date)} · Per hari` : `${formatBookingDate(booking.booking_date)} · ${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}`}</p>
                                </div>
                            </div>
                            <div className="user-history-side">
                                <span className={'booking-status ' + String(booking.status).toLowerCase()}>{statusLabels[booking.status] || booking.status}</span>
                                <strong>Rp {Number(booking.total).toLocaleString('id-ID')}</strong>
                                <Link href={'/booking/' + booking.encrypted_id + '/status'} className="text-link">Detail <ChevronRight /></Link>
                            </div>
                        </article>
                    );
                })}</div> : <div className="user-empty"><CalendarDays /><strong>Belum ada riwayat booking</strong><p>Yuk, pilih venue dan buat booking pertama kamu.</p><Link href="/booking" className="button">Cari venue</Link></div>}
                {bookings.links?.length > 3 && <nav className="booking-pagination user-pagination">{bookings.links.map((link: any, index: number) => link.url ? <Link key={index} href={link.url} className={link.active ? 'active' : ''} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={index} dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>}
            </section>
        </UserShell>
    );
}
