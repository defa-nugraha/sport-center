import { Head, Link } from '@inertiajs/react';
import {
    EmptyState,
    EventCard,
    SectionTitle,
    Shell,
    PublicSelect,
} from '@/components/public-site';
import { EventsSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function Events({ events, sports, filters, sections = {} }: any) {
    const loading = usePageLoading();
    if (loading) return <EventsSkeleton />;
    const hasFilters = Boolean(
        (filters.sport && filters.sport !== 'all') ||
        (filters.status && filters.status !== 'all'),
    );
    const sport = sports.find(
        (item: any) => String(item.id) === String(filters.sport),
    );
    const statusLabels: Record<string, string> = {
        upcoming: 'akan datang',
        ongoing: 'sedang berlangsung',
        completed: 'selesai',
        cancelled: 'dibatalkan',
    };

    return (
        <Shell active="Events">
            <Head title="Acara" />
            <section
                className="listing-hero events-listing-hero"
                style={{
                    backgroundImage:
                        "url('/assets/backgrounds/events.jpg')",
                }}
            >
                <div>
                    <div className="pill">{sections.hero?.eyebrow || 'Kompetisi komunitas'}</div>
                    <h1>
                        {sections.hero?.title || 'Sampai jumpa'}
                        <br />
                        <em>{sections.hero?.title_accent || 'di arena!'}</em>
                    </h1>
                    <p>
                        {sections.hero?.description || 'Temukan turnamen, sesi bermain bersama, dan acara komunitas seru di GGM Majalengka.'}
                    </p>
                </div>
            </section>
            <section className="page-section">
                <div className="filters">
                    <form>
                        <PublicSelect
                            name="sport"
                            defaultValue={filters.sport || 'all'}
                            label="Saring berdasarkan olahraga"
                            options={[
                                { value: 'all', label: 'Semua olahraga' },
                                ...sports.map((item: any) => ({
                                    value: String(item.id),
                                    label: item.name,
                                })),
                            ]}
                        />
                        <PublicSelect
                            name="status"
                            defaultValue={filters.status || 'all'}
                            label="Saring berdasarkan status acara"
                            options={[
                                { value: 'all', label: 'Semua status' },
                                { value: 'upcoming', label: 'Akan datang' },
                                {
                                    value: 'ongoing',
                                    label: 'Sedang berlangsung',
                                },
                                { value: 'completed', label: 'Selesai' },
                                { value: 'cancelled', label: 'Dibatalkan' },
                            ]}
                        />
                        <button className="button" type="submit">
                            Terapkan penyaring
                        </button>
                    </form>
                    {hasFilters && (
                        <div className="active-filters" role="status">
                            <span>
                                Menampilkan acara{' '}
                                {statusLabels[filters.status] || 'semua status'}
                                {sport ? ` untuk ${sport.name}` : ''}
                            </span>
                            <Link href="/events">Hapus semua penyaring</Link>
                        </div>
                    )}
                </div>
                <SectionTitle
                    title="Kalender Acara"
                    copy={`${events.total} acara ditemukan.`}
                />
                {events.data.length ? (
                    <div className="event-grid">
                        {events.data.map((event: any) => (
                            <EventCard event={event} key={event.id} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Acara belum ditemukan"
                        copy="Coba pilih olahraga atau status lain, atau hapus penyaring yang aktif."
                        href="/events"
                    />
                )}
            </section>
        </Shell>
    );
}
