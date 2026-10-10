import { Head, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    EmptyState,
    SectionTitle,
    Shell,
    asset,
} from '@/components/public-site';
import { SportsSkeleton, usePageLoading } from '@/components/page-skeletons';
import { RichText } from '@/components/rich-text-editor';

export default function Sports({ sports, sections = {} }: any) {
    const loading = usePageLoading();
    if (loading) return <SportsSkeleton />;
    return (
        <Shell active="Sports" showBookingPrompt={false}>
            <Head title="Olahraga" />
            <section
                className="listing-hero sports-listing-hero"
                style={{
                    backgroundImage:
                        "url('/assets/backgrounds/sports.jpg')",
                }}
            >
                <div>
                    <div className="pill">{sections.hero?.eyebrow || 'Mainkan olahraga favoritmu'}</div>
                    <h1>
                        {sections.hero?.title || 'Semua orang'}
                        <br />
                        <em>{sections.hero?.title_accent || 'punya ruang untuk bergerak.'}</em>
                    </h1>
                    <p>
                        {sections.hero?.description || 'Dari arena kompetisi hingga olahraga santai, temukan tempat yang paling cocok untukmu.'}
                    </p>
                    <Link className="booking-context-link" href="/facilities">
                        Cari venue &amp; cek jadwal <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                </div>
            </section>
            <section className="page-section">
                <SectionTitle
                    title="Jelajahi Olahraga"
                    copy="Pilih olahraga untuk melihat lapangan, fasilitas, dan acara yang tersedia."
                />
                {sports.length ? (
                    <div className="sport-list">
                        {sports.map((sport: any) => (
                            <Link
                                className="sport-tile"
                                href={`/sports/${sport.slug}`}
                                key={sport.id}
                            >
                                <img
                                    src={asset(sport.image)}
                                    alt={`${sport.name} di GGM Majalengka`}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div>
                                    <span>
                                        {sport.category?.name || 'Olahraga'}
                                    </span>
                                    <h3>{sport.name}</h3>
                                    <RichText html={sport.description} />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Olahraga belum tersedia"
                        copy="Pilihan olahraga terbaru akan segera hadir di sini."
                    />
                )}
            </section>
        </Shell>
    );
}
