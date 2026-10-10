import { Head, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    EmptyState,
    FacilityCard,
    SectionTitle,
    Shell,
    PublicSelect,
} from '@/components/public-site';
import { FacilitiesSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function Facilities({
    facilities,
    regions,
    sports,
    filters,
    sections = {},
}: any) {
    const loading = usePageLoading();
    if (loading) return <FacilitiesSkeleton />;
    const hasFilters = Boolean(
        filters.q ||
        (filters.region && filters.region !== 'all') ||
        (filters.sport && filters.sport !== 'all'),
    );
    const region = regions.find(
        (item: any) => String(item.id) === String(filters.region),
    );
    const sport = sports.find(
        (item: any) => String(item.id) === String(filters.sport),
    );

    return (
        <Shell active="Facilities" showBookingPrompt={false}>
            <Head title="Fasilitas" />
            <section
                className="listing-hero facilities-listing-hero"
                style={{
                    backgroundImage:
                        "url('/assets/backgrounds/facilities.jpg')",
                }}
            >
                <div>
                    <div className="pill">{sections.hero?.eyebrow || 'GGM Majalengka'}</div>
                    <h1>
                        {sections.hero?.title || 'Ruang untuk bergerak,'}
                        <br />
                        <em>{sections.hero?.title_accent || 'hadir untuk semua.'}</em>
                    </h1>
                    <p>
                        {sections.hero?.description || 'Temukan lapangan, arena, dan fasilitas pendukung yang nyaman di Gelanggang Generasi Muda.'}
                    </p>
                    <Link className="booking-context-link" href="#daftar-fasilitas">
                        Pilih venue &amp; cek jadwal <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                </div>
            </section>
            <section id="daftar-fasilitas" className="page-section">
                <div className="booking-flow-strip booking-flow-strip-wide" aria-label="Cara booking venue">
                    <div className="booking-flow-step">
                        <span className="booking-flow-number">1</span>
                        <strong>Pilih venue</strong>
                    </div>
                    <span className="booking-flow-arrow" aria-hidden="true">→</span>
                    <div className="booking-flow-step">
                        <span className="booking-flow-number">2</span>
                        <strong>Cek jadwal kosong</strong>
                    </div>
                    <span className="booking-flow-arrow" aria-hidden="true">→</span>
                    <div className="booking-flow-step">
                        <span className="booking-flow-number">3</span>
                        <strong>Pesan &amp; bayar</strong>
                    </div>
                </div>
                <div className="filters">
                    <form role="search">
                        <label className="sr-only" htmlFor="facility-query">
                            Cari fasilitas
                        </label>
                        <input
                            id="facility-query"
                            name="q"
                            type="search"
                            defaultValue={filters.q}
                            placeholder="Cari fasilitas"
                        />
                        <PublicSelect
                            name="region"
                            defaultValue={filters.region || 'all'}
                            label="Saring berdasarkan wilayah"
                            options={[
                                { value: 'all', label: 'Semua wilayah' },
                                ...regions.map((item: any) => ({
                                    value: String(item.id),
                                    label: item.name,
                                })),
                            ]}
                        />
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
                        <button className="button" type="submit">
                            Terapkan penyaring
                        </button>
                    </form>
                    {hasFilters && (
                        <div className="active-filters" role="status">
                            <span>
                                Menampilkan hasil
                                {filters.q ? ` untuk “${filters.q}”` : ''}
                                {region ? ` di ${region.name}` : ''}
                                {sport ? ` dengan olahraga ${sport.name}` : ''}
                            </span>
                            <Link href="/facilities">
                                Hapus semua penyaring
                            </Link>
                        </div>
                    )}
                </div>
                <SectionTitle
                    title="Semua Fasilitas"
                    copy={`${facilities.total} tempat siap kamu jelajahi di sekitar GGM.`}
                />
                {facilities.data.length ? (
                    <div className="facility-grid">
                        {facilities.data.map((facility: any) => (
                            <FacilityCard
                                facility={facility}
                                key={facility.id}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Fasilitas belum ditemukan"
                        copy="Coba kata kunci lain atau hapus penyaring yang sedang aktif."
                        href="/facilities"
                    />
                )}
                {facilities.links?.length > 3 && (
                    <nav
                        className="pagination"
                        aria-label="Halaman hasil fasilitas"
                    >
                        {facilities.links.map((link: any) =>
                            link.url ? (
                                <Link
                                    key={link.label}
                                    href={link.url}
                                    aria-current={
                                        link.active ? 'page' : undefined
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={link.label}
                                    aria-disabled="true"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </nav>
                )}
            </section>
        </Shell>
    );
}
