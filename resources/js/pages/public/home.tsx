import { Head, Link } from '@inertiajs/react';
import '../../../css/team-section.css';
import {
    ChevronRight,
    BicepsFlexed,
    Building2,
    CalendarDays,
    CircleDotDashed,
    Goal,
    MapPin,
    Quote,
    Search,
    UserRound,
    Activity,
    Clock,
    Dumbbell,
    Trophy,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { HomeSkeleton, usePageLoading } from '@/components/page-skeletons';
import {
    EmptyState,
    EventCard,
    FacilityCard,
    SectionTitle,
    Shell,
    SportCard,
    PublicSelect,
    CTA,
    asset,
} from '@/components/public-site';

export default function Home({
    sports,
    facilities,
    events,
    regions,
    testimonials,
    posts,
    sections = {},
    highlights = [],
    partnerLogos = [],
    teamMembers = [],
    banners = [],
}: any) {
    type HeroSlide = {
        image: string;
        title: string;
        alt?: string;
        location?: string;
        url?: string;
    };
    const loading = usePageLoading();
    const [heroSlide, setHeroSlide] = useState(0);
    const [activePost, setActivePost] = useState(0);
    const fallbackHeroSlides: HeroSlide[] = [
        {
            image: '/assets/ggm/Panggung GGM 1.png',
            title: 'Gelanggang Generasi Muda',
        },
        {
            image: '/assets/ggm/Lapang Serba Guna (Basket)2 1.png',
            title: 'Lapangan Serba Guna',
        },
        {
            image: '/assets/ggm/Joging Track1 1.png',
            title: 'Lintasan Joging GGM',
        },
    ];
    const heroSlides: HeroSlide[] = banners.length
        ? banners.map((banner: any) => ({
              image: banner.image,
              title: banner.title,
              alt: banner.alt_text,
              location: banner.location_label,
              url: banner.url,
          }))
        : fallbackHeroSlides;
    const currentHero = heroSlides[heroSlide];

    useEffect(() => {
        const interval = window.setInterval(() => {
            setHeroSlide((current) => (current + 1) % heroSlides.length);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [heroSlides.length]);

    const popularSportIcon = (name: string) => {
        const normalized = name.toLowerCase();
        if (normalized.includes('basket')) return CircleDotDashed;
        if (normalized.includes('badminton')) return BicepsFlexed;
        return Goal;
    };

    if (loading) return <HomeSkeleton />;

    const fallbackLogos = [
        {
            src: '/assets/ilustrasi/logo-pemda.jpeg',
            alt: 'Pemerintah Kabupaten Majalengka',
        },
        {
            src: '/assets/ilustrasi/logo-pertamina.png',
            alt: 'Pertamina',
        },
        {
            src: '/assets/ilustrasi/logo-ggm.png',
            alt: 'GGM Majalengka',
        },
    ];
    const logos = partnerLogos.length ? partnerLogos.map((logo: any) => ({ src: logo.image, alt: logo.alt_text || logo.name, url: logo.url })) : fallbackLogos;
    const iconMap: Record<string, any> = { activity: Activity, building: Building2, calendar: CalendarDays, clock: Clock, dumbbell: Dumbbell, 'map-pin': MapPin, trophy: Trophy, users: Users };
    const section = (key: string, fallback: any) => ({ ...fallback, ...(sections[key] || {}) });
    const hero = section('hero', { eyebrow: 'Pusat Aktivitas Olahraga Majalengka', title: 'Temukan Olahragamu.', title_accent: 'Temukan Tempatmu.', description: 'Yuk, jelajahi fasilitas, acara, dan tempat olahraga seru di Majalengka.', button_label: 'Jelajahi fasilitas' });

    return (
        <Shell active="Home">
            <Head title="Temukan Olahragamu, Temukan Tempatmu" />
            <section className="home-hero">
                <div className="hero-content">
                    <div className="pill">
                        <MapPin size={14} aria-hidden="true" /> {hero.eyebrow}
                    </div>
                    <h1>
                        {hero.title}
                        <br />
                        <em>{hero.title_accent}</em>
                    </h1>
                    <p>
                        {hero.description}
                    </p>
                    <form
                        className="search-box"
                        action="/facilities"
                        role="search"
                    >
                        <div className="search-location">
                            <MapPin size={20} aria-hidden="true" />
                            <label className="sr-only" htmlFor="home-region">
                                Pilih wilayah
                            </label>
                            <PublicSelect
                                name="region"
                                label="Pilih wilayah"
                                options={[
                                    { value: 'all', label: 'Semua wilayah' },
                                    ...regions.map((region: any) => ({
                                        value: String(region.id),
                                        label: region.name,
                                    })),
                                ]}
                            />
                        </div>
                        <div className="hero-search-input">
                            <Search size={20} aria-hidden="true" />
                            <label className="sr-only" htmlFor="home-search">
                                Cari fasilitas atau olahraga
                            </label>
                            <input
                                id="home-search"
                                name="q"
                                type="search"
                                placeholder="Cari fasilitas atau olahraga"
                            />
                        </div>
                        <button type="submit">
                            {hero.button_label}
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                    </form>
                    <div className="popular-sports">
                        <span>Olahraga populer:</span>
                        {sports.slice(0, 3).map((sport: any) => {
                            const Icon = popularSportIcon(sport.name);
                            return (
                                <Link
                                    href={`/sports/${sport.slug}`}
                                    key={sport.id}
                                >
                                    <Icon aria-hidden="true" />
                                    {sport.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hero-benefits" aria-label="Keunggulan GGM">
                        {(highlights.length ? highlights : [
                            { icon: 'building', title: 'Fasilitas Modern', description: 'Tempat nyaman untuk warga Majalengka' },
                            { icon: 'calendar', title: 'Acara Seru', description: 'Jangan lewatkan jadwal terbarunya' },
                            { icon: 'map-pin', title: 'Akses Mudah', description: 'Lokasi strategis di pusat Majalengka' },
                        ]).map((item: any) => { const Icon = iconMap[item.icon] || Activity; return <div key={item.id || item.title}><Icon aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.description}</small></span></div>; })}
                    </div>
                </div>
                <div className="hero-photo">
                    {currentHero.url ? <Link href={currentHero.url}><img
                        src={asset(currentHero.image)}
                        alt={currentHero.alt || `${currentHero.title} di GGM Majalengka`}
                        decoding="async"
                    /></Link> : <img
                        src={asset(currentHero.image)}
                        alt={currentHero.alt || `${currentHero.title} di GGM Majalengka`}
                        decoding="async"
                    />}
                    <div className="hero-location">
                        <MapPin size={18} aria-hidden="true" />
                        {currentHero.location || 'Majalengka, Jawa Barat'}
                    </div>
                    <div className="hero-slider-controls">
                        <div aria-label={`Gambar ${heroSlide + 1} dari ${heroSlides.length}`}>
                            {heroSlides.map((slide, index) => (
                                <button
                                    type="button"
                                    key={slide.image}
                                    className={
                                        index === heroSlide ? 'active' : ''
                                    }
                                    onClick={() => setHeroSlide(index)}
                                    aria-label={`Tampilkan gambar ${index + 1}: ${slide.title}`}
                                    aria-current={
                                        index === heroSlide ? 'true' : undefined
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="soft-band sport-discovery">
                <SectionTitle
                    title={section('sports', {}).title || 'Temukan Olahraga Favoritmu'}
                    accent="Olahraga"
                    copy={section('sports', {}).description}
                    href={section('sports', {}).button_url || '/sports'}
                    link={section('sports', {}).button_label || 'Lihat semua olahraga'}
                />
                {sports.length ? (
                    <div className="sport-row">
                        {sports.slice(0, 6).map((sport: any) => (
                            <SportCard
                                key={sport.id}
                                sport={sport}
                                variant="discovery"
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Olahraga belum tersedia"
                        copy="Pilihan olahraga terbaru akan segera hadir di sini."
                    />
                )}
            </section>

            <section className="page-section featured-facilities">
                <SectionTitle
                    eyebrow={section('facilities', {}).eyebrow}
                    title={section('facilities', {}).title || 'Fasilitas Unggulan'}
                    copy={section('facilities', {}).description}
                    href={section('facilities', {}).button_url || '/facilities'}
                    link={section('facilities', {}).button_label || 'Lihat semua fasilitas'}
                />
                {facilities.length ? (
                    <div className="facility-grid">
                        {facilities.map((facility: any) => (
                            <FacilityCard
                                facility={facility}
                                key={facility.id}
                                variant="featured"
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Fasilitas pilihan belum tersedia"
                        copy="Jelajahi semua fasilitas untuk menemukan tempat bermain yang cocok."
                        href="/facilities"
                        action="Jelajahi fasilitas"
                    />
                )}
            </section>

            <section className="soft-band upcoming-events">
                <SectionTitle
                    eyebrow={section('events', {}).eyebrow}
                    title={section('events', {}).title || 'Acara Mendatang'}
                    copy={section('events', {}).description}
                    href={section('events', {}).button_url || '/events'}
                    link={section('events', {}).button_label || 'Lihat kalender acara'}
                />
                {events.length ? (
                    <div className="event-grid">
                        {events.slice(0, 4).map((event: any) => (
                            <EventCard
                                event={event}
                                key={event.id}
                                variant="featured"
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Belum ada acara mendatang"
                        copy="Jadwal baru sedang disiapkan. Cek kembali kalender acara kami, ya."
                        href="/events"
                        action="Lihat kalender acara"
                    />
                )}
            </section>

            {posts.length > 0 && (
                <section className="page-section latest-news">
                    <div className="news-heading">
                        <span>{section('news', {}).eyebrow}</span>
                        <h2>{section('news', {}).title || 'Cerita & Kabar Terbaru'}</h2>
                        <p>{section('news', {}).description}</p>
                    </div>
                    <div
                        className={`news-showcase news-count-${Math.min(posts.length, 3)}`}
                        aria-label="Kabar terbaru GGM"
                    >
                        {posts.map((post: any, index: number) => {
                            const distance =
                                (index - activePost + posts.length) %
                                posts.length;
                            const position =
                                distance === 0
                                    ? 'active'
                                    : distance === 1
                                      ? 'next'
                                      : index ===
                                          (activePost - 1 + posts.length) %
                                              posts.length
                                        ? 'previous'
                                        : 'hidden';
                            return (
                                <Link
                                    href={`/kabar/${post.slug}`}
                                    className={`news-slide ${position}`}
                                    key={post.id}
                                    aria-hidden={position === 'hidden'}
                                    tabIndex={position === 'hidden' ? -1 : 0}
                                >
                                    <img
                                        src={asset(post.featured_image)}
                                        alt={post.title}
                                    />
                                    <div>
                                        <span>
                                            {post.category?.name || 'Kabar GGM'}
                                        </span>
                                        <h3>{post.title}</h3>
                                        <p>{post.excerpt}</p>
                                        <strong>
                                            Baca selengkapnya <ChevronRight />
                                        </strong>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    <div className="news-controls">
                        <div>
                            {posts.map((post: any, index: number) => (
                                <button
                                    key={post.id}
                                    className={
                                        index === activePost ? 'active' : ''
                                    }
                                    onClick={() => setActivePost(index)}
                                    aria-label={`Tampilkan kabar ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                    <Link href="/kabar" className="button news-all">
                        Lihat semua kabar <ChevronRight />
                    </Link>
                </section>
            )}

            <section className="soft-band community-reviews">
                <SectionTitle
                    eyebrow={section('testimonials', {}).eyebrow}
                    title={section('testimonials', {}).title || 'Apa Kata Komunitas Olahraga'}
                    copy={section('testimonials', {}).description}
                />
                {testimonials.length ? (
                    <div className="testimonial-grid">
                        {testimonials.map((testimonial: any) => (
                            <article
                                className="testimonial"
                                key={testimonial.id}
                            >
                                <div className="testimonial-content">
                                    <span
                                        className="quote-mark"
                                        aria-hidden="true"
                                    >
                                        <Quote />
                                    </span>
                                    <div>
                                        <div
                                            className="stars"
                                            aria-label={`${testimonial.rating || 5} dari 5 bintang`}
                                        >
                                            <span aria-hidden="true">
                                                {'★'.repeat(
                                                    testimonial.rating || 5,
                                                )}
                                            </span>
                                        </div>
                                        <p>“{testimonial.review}”</p>
                                    </div>
                                </div>
                                <footer>
                                    <span className="testimonial-avatar">
                                        <UserRound aria-hidden="true" />
                                    </span>
                                    <span>
                                        <strong>{testimonial.name}</strong>
                                        <small>
                                            {testimonial.organization}
                                        </small>
                                    </span>
                                </footer>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Belum ada cerita dari komunitas"
                        copy="Jadilah yang pertama berbagi pengalaman seru di GGM Majalengka."
                    />
                )}
            </section>

            <section className="page-section visitor-marquee">
                <SectionTitle
                    eyebrow={section('partners', {}).eyebrow}
                    title={section('partners', {}).title || 'Mereka Pernah Jadi Bagian dari GGM'}
                    copy={section('partners', {}).description}
                />
                <div
                    className="logo-marquee"
                    aria-label="Instansi dan mitra GGM Majalengka"
                >
                    <div className="logo-marquee-track">
                        {[...logos, ...logos].map(
                            (logo, index) => (
                                <div
                                    className="visitor-logo"
                                    key={`${logo.src}-${index}`}
                                    aria-hidden={index >= logos.length}
                                >
                                    <img
                                        src={logo.src}
                                        alt={
                                            index < logos.length
                                                ? logo.alt
                                                : ''
                                        }
                                    />
                                </div>
                            ),
                        )}
                    </div>
                </div>
            </section>



            <section className="page-section booking-section">
                <CTA illustrated eyebrow={section('booking', {}).eyebrow} title={section('booking', {}).title} copy={section('booking', {}).description} buttonLabel={section('booking', {}).button_label} />
            </section>

            {teamMembers.length > 0 && (
                <section className="page-section team-section">
                    <div className="team-reference-heading">
                        <span>TIM KAMI</span>
                        <h2>KENALAN DENGAN TIM KAMI, YUK!</h2>
                        <p>Orang-orang kreatif di balik pengalaman olahraga digital yang lebih mudah dan menyenangkan di GGM Majalengka.</p>
                    </div>
                    <div className={`team-reference-grid team-reference-grid-count-${Math.min(teamMembers.length, 3)}`}>
                        {teamMembers.map((member: any, index: number) => (
                            <article
                                className={`team-reference-card team-reference-card-${(index % 3) + 1}`}
                                key={member.id}
                            >
                                <div className="team-reference-bubble">
                                    <h3>{member.name}</h3>
                                    {member.description && <p>{member.description}</p>}
                                </div>
                                <div className="team-reference-socials" aria-hidden="true">
                                    <Activity />
                                    <Users />
                                    <MapPin />
                                </div>
                                <img
                                    src={asset(member.photo)}
                                    alt={member.name}
                                    loading="lazy"
                                />
                            </article>
                        ))}
                    </div>
                    <div className="team-reference-cta">
                        <strong>YUK, MULAI AKTIF!</strong>
                        <span>Temukan tempat untuk olahraga favoritmu.</span>
                        <Link href="/facilities">JELAJAHI FASILITAS <ChevronRight size={15} aria-hidden="true" /></Link>
                    </div>
                </section>
            )}
        </Shell>
    );
}
