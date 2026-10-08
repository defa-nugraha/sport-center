import { Link } from '@inertiajs/react';
import { CalendarCheck, CalendarDays, ChevronRight, Clock3, UserRound } from 'lucide-react';
import { UserShell } from '@/components/user-layout';
import { BookingStatusBadge } from '@/components/booking-status-badge';

export default function Dashboard({ user, stats, bookings }: any) {
    return (
        <UserShell active="dashboard" title={'Halo, ' + user.name + '.'} description="Kelola booking venue, lihat jadwal, dan pantau transaksi kamu di GGM.">
            <section className="user-stat-grid">
                <article><CalendarDays /><span>Total booking</span><strong>{stats.total}</strong></article>
                <article><Clock3 /><span>Booking aktif</span><strong>{stats.upcoming}</strong></article>
                <article><CalendarCheck /><span>Selesai dibayar</span><strong>{stats.confirmed}</strong></article>
            </section>
            <section className="user-panel user-quick-panel">
                <div className="user-panel-head"><div><span className="eyebrow"><i /> Booking venue</span><h2>Butuh tempat untuk berolahraga?</h2><p>Pilih venue, cek jadwal kosong, lalu lanjutkan pembayaran dengan aman.</p></div><Link href="/booking" className="button">Booking sekarang <ChevronRight /></Link></div>
            </section>
            <section className="user-panel">
                <div className="user-panel-head"><div><span className="eyebrow"><i /> Aktivitas terbaru</span><h2>Booking terakhir</h2></div><Link href="/bookings" className="text-link">Lihat semua <ChevronRight /></Link></div>
                {bookings.length ? <div className="user-booking-list">{bookings.map((booking: any) => <Link href={'/booking/' + booking.encrypted_id + '/status'} className="user-booking-row" key={booking.id}><div className="user-booking-icon"><CalendarDays /></div><div><strong>{booking.facility?.name}</strong><span>{booking.booking_date} · {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</span></div><BookingStatusBadge status={booking.status} /></Link>)}</div> : <div className="user-empty"><UserRound /><strong>Belum ada booking</strong><p>Booking pertama kamu akan muncul di sini.</p></div>}
            </section>
        </UserShell>
    );
}
