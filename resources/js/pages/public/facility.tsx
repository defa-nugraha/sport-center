import { Head, Link } from '@inertiajs/react';
import { ChevronRight, MapPin } from 'lucide-react';
import { RichText } from '@/components/rich-text-editor';
import {
    asset,
    BookingLink,
    Breadcrumb,
    CTA,
    EmptyState,
    GalleryViewer,
    SectionTitle,
    Shell,
    SportCard,
} from '@/components/public-site';
import { FacilitySkeleton, usePageLoading } from '@/components/page-skeletons';

export default function Facility({ facility, sections = {} }: any) {
    const loading = usePageLoading();
    if (loading) return <FacilitySkeleton />;
    const generalSpecifications = [
        { label: 'Jenis tempat', value: facility.venue_type },
        { label: 'Kapasitas', value: facility.capacity },
        { label: 'Jam operasional', value: facility.operating_hours },
        { label: 'Dimensi', value: facility.dimensions },
    ].filter((item) => item.value);
    const specifications = [
        ...generalSpecifications.filter(
            (general) =>
                !facility.specifications.some(
                    (item: any) =>
                        item.label.toLowerCase() === general.label.toLowerCase(),
                ),
        ),
        ...facility.specifications,
    ];
    const informationImage =
        facility.galleries?.[1]?.image ||
        facility.galleries?.[0]?.image ||
        facility.hero_image;
    return (
        <Shell active="Facilities">
            <Head title={facility.name} />
            <section className="page-section">
                <Breadcrumb items={['Facilities', facility.name]} />
                <div className="detail-hero">
                    <img
                        src={asset(facility.hero_image)}
                        alt={`Fasilitas ${facility.name}`}
                        decoding="async"
                    />
                    <div>
                        <div className="pill">GGM Majalengka</div>
                        <h1>{facility.name}</h1>
                        <p>{facility.subtitle}</p>
                        <RichText html={facility.description} />
                        {facility.booking_enabled ? (
                            <Link className="button lime" href={'/booking/' + facility.slug}>
                                Pesan fasilitas ini{' '}
                                <ChevronRight size={15} aria-hidden="true" />
                            </Link>
                        ) : (
                            <BookingLink className="button lime">
                                Reservasi fasilitas ini{' '}
                                <ChevronRight size={15} aria-hidden="true" />
                            </BookingLink>
                        )}
                    </div>
                </div>
            </section>
            {sections.overview?.enabled !== false && <section className="page-section">
                <SectionTitle
                    eyebrow={sections.overview?.eyebrow || 'Informasi fasilitas'}
                    title={sections.overview?.title || 'Satu Tempat, Banyak Aktivitas Seru'}
                    copy={sections.overview?.description || facility.description}
                />
                <div className="spec-layout">
                    <div className="spec-copy">
                        <p>
                            <MapPin size={15} aria-hidden="true" />{' '}
                            {facility.address}
                        </p>
                        {specifications.map((specification: any, index: number) => (
                            <div className="spec-row" key={specification.id || `${specification.label}-${index}`}>
                                <span>{specification.label}</span>
                                <b>{specification.value}</b>
                            </div>
                        ))}
                    </div>
                    <img
                        src={asset(informationImage)}
                        alt={`Bagian dalam ${facility.name}`}
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            </section>}
            {sections.gallery?.enabled !== false && <section className="soft-band">
                <SectionTitle
                    eyebrow={sections.gallery?.eyebrow || 'Dokumentasi visual'}
                    title={sections.gallery?.title || 'Galeri Fasilitas'}
                    copy={sections.gallery?.description}
                />
                {facility.galleries.length ? (
                    <>
                        <div className="gallery-grid">
                            {facility.galleries.map((gallery: any) => (
                                <figure key={gallery.id}>
                                    <img
                                        src={asset(gallery.image)}
                                        alt={
                                            gallery.caption ||
                                            `Galeri ${facility.name}`
                                        }
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <figcaption>{gallery.caption}</figcaption>
                                </figure>
                            ))}
                        </div>
                        <GalleryViewer
                            images={facility.galleries}
                            title={`Galeri ${facility.name}`}
                        />
                    </>
                ) : (
                    <EmptyState
                        title="Foto galeri belum tersedia"
                        copy="Foto-foto fasilitas akan segera ditampilkan di sini."
                    />
                )}
            </section>}
            {sections.features?.enabled !== false && <section className="page-section">
                <SectionTitle
                    eyebrow={sections.features?.eyebrow || 'Fasilitas pendukung'}
                    title={sections.features?.title || 'Fasilitas Penunjang Pertandingan'}
                    copy={sections.features?.description || 'Fasilitas penunjang lengkap untuk mendukung atlet, wasit, dan komunitas.'}
                />
                {facility.features.length ? (
                    <div className="feature-grid">
                        {facility.features.map((feature: any) => (
                            <article className="feature-card" key={feature.id}>
                                <img
                                    src={asset(feature.image)}
                                    alt={feature.name}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div>
                                    <h3>{feature.name}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Fasilitas pendukung belum tercantum"
                        copy="Hubungi pengelola untuk mengetahui fasilitas terbaru yang tersedia."
                    />
                )}
            </section>}
            {sections.sports?.enabled !== false && <section className="page-section">
                <SectionTitle eyebrow={sections.sports?.eyebrow} title={sections.sports?.title || 'Olahraga yang Tersedia di Sini'} copy={sections.sports?.description} />
                {facility.sports.length ? (
                    <div className="sport-row">
                        {facility.sports.map((sport: any) => (
                            <SportCard key={sport.id} sport={sport} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Olahraga belum tercantum"
                        copy="Hubungi pengelola untuk memastikan aktivitas yang bisa dilakukan di sini."
                    />
                )}
            </section>}
            {sections.booking?.enabled !== false && (
                <section className="page-section facility-booking-section">
                    <div className="cta">
                            <div>
                                <div>
                                    <h2>{sections.booking?.title || 'Pesan venue sekarang'}</h2>
                                    <RichText html={sections.booking?.description || 'Pilih tanggal dan jam yang Anda inginkan, lalu lanjutkan pembayaran.'} />
                                </div>
                                <Link className="button lime" href={'/booking/' + facility.slug}>
                                    Mulai booking <ChevronRight size={16} aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                </section>
            )}
        </Shell>
    );
}
