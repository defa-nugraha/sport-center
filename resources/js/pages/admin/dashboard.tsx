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
} from 'lucide-react';
import { AdminDashboardSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function AdminDashboard({ stats, recentEvents, visitors }: any) {
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
