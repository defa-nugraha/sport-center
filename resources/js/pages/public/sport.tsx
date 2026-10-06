import { Head, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { RichText } from '@/components/rich-text-editor';
import {
    asset,
    Breadcrumb,
    CTA,
    EmptyState,
    GalleryViewer,
    SectionTitle,
    Shell,
} from '@/components/public-site';
import { SportSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function Sport({ sport, otherSports, sections = {} }: any) {
    const loading = usePageLoading();
    if (loading) return <SportSkeleton />;
    const facility = sport.facilities[0];
    const gallery = sport.galleries?.length
        ? sport.galleries
        : facility?.galleries || [];
    const galleryItems = gallery.length
        ? gallery
        : sport.image
          ? [{ image: sport.image, caption: 'Fasilitas siap pertandingan' }]
          : [];

    return (
        <Shell active="Sports">
            <Head title={sport.name} />
            <section className="page-section">
                <Breadcrumb items={['Sports', sport.name]} />
                <div className="sport-hero">
                    <img
                        src={asset(sport.image)}
                        alt={`${sport.name} di GGM Majalengka`}
                        decoding="async"
                    />
                    <div>
                        <div className="pill">Olahraga</div>
                        <h1>{sport.name}</h1>
                        <RichText html={sport.description} />
                        <div className="chips">
                            <span>{sport.court_type}</span>
                            <span>{sport.surface}</span>
                            <span>Majalengka, Jawa Barat</span>
                        </div>
                    </div>
                </div>
            </section>
            <section className="page-section">
                <SectionTitle
                    eyebrow={sections.facility?.eyebrow || 'Fasilitas utama'}
                    title={sections.facility?.title === 'Arena Olahraga' ? `Arena ${sport.name}` : sections.facility?.title || `Arena ${sport.name}`}
                />
                {facility ? (
                    <div className="spec-layout">
                        <img
                            src={asset(facility.hero_image)}
                            alt={`${facility.name} untuk ${sport.name}`}
                            loading="lazy"
                            decoding="async"
                        />
                        <div className="spec-copy">
                            <h3>{facility.name}</h3>
                            <RichText html={facility.description || sport.description} />
                            <Link
                                className="button"
                                href={`/facilities/${facility.slug}`}
                            >
                                Lihat fasilitas{' '}
                                <ChevronRight size={14} aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <EmptyState
                        title="Fasilitas belum terhubung"
                        copy="Hubungi pengelola GGM untuk mengetahui tempat olahraga ini tersedia."
                    />
                )}
            </section>
            <section className="soft-band">
                <SectionTitle
                    eyebrow={sections.gallery?.eyebrow || 'Dokumentasi visual'}
                    title={sections.gallery?.title || 'Suasana Arena dan Pertandingan'}
                    copy={sections.gallery?.description || 'Lihat lebih dekat suasana olahraga di arena utama GGM Majalengka.'}
                />
                {galleryItems.length ? (
                    <>
                        <div className="gallery-grid">
                            {galleryItems
                                .slice(0, 3)
                                .map((item: any, index: number) => (
                                    <figure key={item.id || index}>
                                        <img
                                            src={asset(item.image)}
                                            alt={
                                                item.caption ||
                                                `Arena ${sport.name}`
                                            }
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <figcaption>
                                            {item.caption ||
                                                'Fasilitas siap pertandingan'}
                                        </figcaption>
                                    </figure>
                                ))}
                        </div>
                        <GalleryViewer
                            images={galleryItems}
                            title={`Galeri ${sport.name}`}
                        />
                    </>
                ) : (
                    <EmptyState
                        title="Foto arena belum tersedia"
                        copy="Dokumentasi olahraga ini akan segera hadir di sini."
                    />
                )}
            </section>
            <section className="page-section">
                <SectionTitle
                    eyebrow={sections.related?.eyebrow || 'Olahraga lainnya'}
                    title={sections.related?.title || 'Jelajahi Olahraga Lain'}
                />
                {otherSports.length ? (
                    <div className="sport-row">
                        {otherSports.map((other: any) => (
                            <Link
                                href={`/sports/${other.slug}`}
                                className="sport-card image-card"
                                key={other.id}
                            >
                                <img
                                    src={asset(other.image)}
                                    alt={other.name}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <strong>{other.name}</strong>
                                <small>{other.court_type}</small>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Olahraga terkait belum tersedia"
                        copy="Lihat daftar olahraga lengkap untuk menemukan aktivitas lainnya."
                        href="/sports"
                        action="Jelajahi olahraga"
                    />
                )}
                <CTA title={sections.booking?.title || `Siap tanding ${sport.name}?`} copy={sections.booking?.description} buttonLabel={sections.booking?.button_label} />
            </section>
        </Shell>
    );
}
