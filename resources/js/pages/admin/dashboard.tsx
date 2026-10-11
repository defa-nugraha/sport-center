import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Dumbbell,
    Eye,
    FileText,
    Inbox,
    MessageSquareText,
    Plus,
    Users,
    Wallet,
    Clock3,
    BadgeCheck,
    RotateCcw,
    ArrowUpRight,
} from 'lucide-react';
import { AdminDashboardSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function AdminDashboard({ stats, recentEvents, recentBookings = [], visitors }: any) {
    const loading = usePageLoading();
    if (loading) return <AdminDashboardSkeleton />;
    const statusLabels: Record<string, string> = {
        upcoming: 'Akan datang',
        ongoing: 'Berlangsung',
        completed: 'Selesai',
        cancelled: 'Dibatalkan',
        draft: 'Draf',
    };
    const cards = [
        ['facilities', 'Fasilitas', stats.facilities, Building2, 'blue'],
        ['sports', 'Olahraga', stats.sports, Dumbbell, 'purple'],
        ['events', 'Acara terbit', stats.events, CalendarDays, 'yellow'],
        ['posts', 'Artikel', stats.posts, FileText, 'white'],
        ['views', 'Kunjungan hari ini', visitors.todayViews, Eye, 'blue'],
        ['unique', 'Pengunjung hari ini', visitors.todayUnique, Users, 'purple'],
    ];
    const peak = Math.max(
        1,
        ...visitors.daily.map((item: any) => item.total),
    );

    return (
        <div className="admin-shell">
            <Head title="Dasbor admin" />
            <AdminSidebar active="dashboard" />
            <main className="admin-main">
                <AdminTopbar
                    title="Dasbor Admin"
                    description="Pantau konten dan aktivitas pengunjung GGM Majalengka."
                    action={
                        <Link className="button" href="/admin/content">
                            <Plus aria-hidden="true" /> Kelola konten
                        </Link>
                    }
                />
                <section className="admin-panel admin-overview-panel">
                    <div className="panel-head">
                        <div>
                            <h2>Ringkasan operasional</h2>
                            <p>Pantau transaksi, booking, dan hal yang perlu segera ditindaklanjuti.</p>
                        </div>
                        <Link href="/admin/bookings" className="admin-overview-link">Semua booking <ArrowUpRight aria-hidden="true" /></Link>
                    </div>
                    <div className="admin-overview-grid">
                        <Link href="/admin/bookings" className="admin-overview-card">
                            <span className="admin-overview-icon blue"><CalendarDays aria-hidden="true" /></span>
                            <span className="admin-overview-copy"><small>Total booking</small><strong>{Number(stats.bookingsTotal || 0).toLocaleString('id-ID')}</strong><em>{Number(stats.bookingsToday || 0).toLocaleString('id-ID')} booking hari ini</em></span>
                        </Link>
                        <Link href="/admin/bookings?status=PENDING_PAYMENT" className="admin-overview-card">
                            <span className="admin-overview-icon amber"><Clock3 aria-hidden="true" /></span>
                            <span className="admin-overview-copy"><small>Menunggu pembayaran</small><strong>{Number(stats.bookingsPending || 0).toLocaleString('id-ID')}</strong><em>{Number(stats.paymentsPending || 0).toLocaleString('id-ID')} transaksi pending</em></span>
                        </Link>
                        <Link href="/admin/bookings?status=CONFIRMED" className="admin-overview-card">
                            <span className="admin-overview-icon green"><BadgeCheck aria-hidden="true" /></span>
                            <span className="admin-overview-copy"><small>Booking terkonfirmasi</small><strong>{Number(stats.bookingsConfirmed || 0).toLocaleString('id-ID')}</strong><em>Siap dipantau</em></span>
                        </Link>
                        <div className="admin-overview-card">
                            <span className="admin-overview-icon violet"><Wallet aria-hidden="true" /></span>
                            <span className="admin-overview-copy"><small>Pembayaran lunas bulan ini</small><strong className="admin-overview-currency">{Number(stats.revenueThisMonth || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</strong><em>Berdasarkan pembayaran terverifikasi</em></span>
                        </div>
                    </div>
                    <div className="admin-overview-alerts">
                        <Link href="/admin/bookings?status=PENDING_PAYMENT" className="admin-overview-alert">
                            <Clock3 aria-hidden="true" /><span><strong>{Number(stats.bookingsPending || 0)}</strong> booking menunggu pembayaran</span><ArrowUpRight aria-hidden="true" />
                        </Link>
                        <Link href="/admin/bookings" className="admin-overview-alert">
                            <RotateCcw aria-hidden="true" /><span><strong>{Number(stats.refundsPending || 0)}</strong> permintaan refund perlu diperiksa</span><ArrowUpRight aria-hidden="true" />
                        </Link>
                        <Link href="/admin/reviews" className="admin-overview-alert">
                            <MessageSquareText aria-hidden="true" /><span><strong>{Number(stats.reviewsPending || 0)}</strong> ulasan menunggu moderasi</span><ArrowUpRight aria-hidden="true" />
                        </Link>
                    </div>
                </section>
                <div className="admin-stat-grid">
                    {cards.map(([key, label, value, Icon, tone]: any) => (
                        <article
                            className={`admin-stat-card ${tone}`}
                            key={key}
                        >
                            <div>
                                <span>{label}</span>
                                <Icon aria-hidden="true" />
                            </div>
                            <strong>
                                {Number(value).toLocaleString('id-ID')}
                            </strong>
                        </article>
                    ))}
                </div>
                <div className="admin-dashboard-grid">
                    <section className="admin-panel admin-recent-bookings-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Booking terbaru</h2>
                                <p>Aktivitas booking terbaru, termasuk mode per jam dan per hari.</p>
                            </div>
                            <Link href="/admin/bookings">Lihat semua</Link>
                        </div>
                        {recentBookings.length ? recentBookings.map((booking: any) => {
                            const statusLabels: Record<string, string> = {
                                PENDING_PAYMENT: 'Menunggu bayar',
                                CONFIRMED: 'Terkonfirmasi',
                                FAILED: 'Gagal',
                                EXPIRED: 'Kedaluwarsa',
                                CANCELLED: 'Dibatalkan',
                                COMPLETED: 'Selesai',
                                REFUNDED: 'Refund',
                            };
                            const dateLabel = booking.booking_date
                                ? new Date(booking.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
                                : 'Tanggal belum tersedia';
                            return (
                                <Link href={`/admin/bookings?search=${encodeURIComponent(booking.booking_number || "")}`} className="admin-recent-booking-row" key={booking.id}>
                                    <span className="admin-recent-booking-icon"><CalendarDays aria-hidden="true" /></span>
                                    <span className="admin-recent-booking-main">
                                        <strong>{booking.customer_name || 'Pelanggan'}</strong>
                                        <small>{booking.booking_number} · {booking.facility?.name || 'Venue'} · {dateLabel}{booking.booking_mode === 'daily' ? ' · Per hari' : ' · Per jam'}</small>
                                    </span>
                                    <span className={`admin-recent-booking-status status-${String(booking.status).toLowerCase()}`}>{statusLabels[booking.status] || booking.status}</span>
                                    <ArrowUpRight className="admin-recent-booking-arrow" aria-hidden="true" />
                                </Link>
                            );
                        }) : <p className="admin-placeholder">Belum ada booking. Booking baru akan muncul di sini.</p>}
                    </section>
                    <section className="admin-panel admin-analytics-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Kunjungan 7 hari terakhir</h2>
                                <p>
                                    {visitors.totalViews.toLocaleString(
                                        'id-ID',
                                    )}{' '}
                                    total tampilan halaman tercatat.
                                </p>
                            </div>
                            <Eye aria-hidden="true" />
                        </div>
                        <div
                            className="visitor-chart"
                            aria-label="Grafik kunjungan tujuh hari terakhir"
                        >
                            {visitors.daily.map((item: any) => (
                                <div
                                    className="visitor-bar-item"
                                    key={item.date}
                                >
                                    <strong>{item.total}</strong>
                                    <div>
                                        <span
                                            style={{
                                                height: `${Math.max(8, (item.total / peak) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <small>{item.label}</small>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="admin-panel top-pages-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Halaman populer</h2>
                                <p>Halaman yang paling sering dikunjungi.</p>
                            </div>
                        </div>
                        {visitors.topPages.length ? (
                            visitors.topPages.map(
                                (page: any, index: number) => (
                                    <div
                                        className="top-page-row"
                                        key={page.path}
                                    >
                                        <span>{index + 1}</span>
                                        <strong>{page.path}</strong>
                                        <small>
                                            {page.total.toLocaleString('id-ID')}{' '}
                                            kunjungan
                                        </small>
                                    </div>
                                ),
                            )
                        ) : (
                            <p className="admin-placeholder">
                                Data kunjungan akan muncul setelah situs
                                dikunjungi.
                            </p>
                        )}
                    </section>
                    <section className="admin-panel recent-events-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Acara terbaru</h2>
                                <p>Jadwal yang terakhir dikelola.</p>
                            </div>
                            <Link href="/admin/content">Buka konten</Link>
                        </div>
                        {recentEvents.map((event: any) => (
                            <div className="admin-row" key={event.id}>
                                <div>
                                    <strong>{event.title}</strong>
                                    <small>
                                        {event.sport?.name || 'Umum'} ·{' '}
                                        {new Date(
                                            event.starts_at,
                                        ).toLocaleDateString('id-ID')}
                                    </small>
                                </div>
                                <span
                                    className={`status ${event.status}`}
                                >
                                    {statusLabels[event.status] || event.status}
                                </span>
                            </div>
                        ))}
                    </section>
                    <section className="admin-panel admin-summary-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Perlu perhatian</h2>
                                <p>Ringkasan aktivitas pengelolaan.</p>
                            </div>
                        </div>
                        <div className="summary-metric">
                            <Inbox />
                            <span>
                                <strong>{stats.inquiries}</strong>
                                <small>pesan baru</small>
                            </span>
                        </div>
                        <Link className="summary-metric" href="/admin/reviews">
                            <MessageSquareText />
                            <span>
                                <strong>{stats.reviewsPending}</strong>
                                <small>ulasan menunggu</small>
                            </span>
                        </Link>
                        <div className="summary-metric">
                            <FileText />
                            <span>
                                <strong>{stats.posts}</strong>
                                <small>artikel tersimpan</small>
                            </span>
                        </div>
                        <div className="summary-metric">
                            <Eye />
                            <span>
                                <strong>{visitors.totalViews}</strong>
                                <small>total tampilan</small>
                            </span>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
