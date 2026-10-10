import { Link, useForm, usePage } from '@inertiajs/react';
import '../../css/public-booking-ux.css';
import {
    Activity,
    ArrowUpRight,
    ChevronRight,
    BicepsFlexed,
    CalendarDays,
    CheckCircle2,
    CircleDotDashed,
    Footprints,
    Facebook,
    Goal,
    Instagram,
    LoaderCircle,
    Mail,
    MapPin,
    Menu,
    MessageCircle,
    Music2,
    Phone,
    Search,
    Shirt,
    Star,
    Volleyball,
    X,
    Youtube,
} from 'lucide-react';
import { useState } from 'react';
import { ProductTour } from '@/components/product-tour';
import { RichText } from '@/components/rich-text-editor';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Settings = {
    phone?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    address?: string;
    email?: string;
};

export const asset = (path?: string) => {
    if (!path) return '/assets/ggm/Lapang Serba Guna (Basket)2 1.png';
    if (path.startsWith('/') || path.startsWith('http')) return path;
    return `/storage/${path}`;
};
const plainText = (value?: string) =>
    value?.replace(/<[^>]*>/g, '').trim() || '';

export function GalleryViewer({
    images,
    title,
}: {
    images: any[];
    title: string;
}) {
    const [open, setOpen] = useState(false);
    if (!images?.length) return null;
    return (
        <>
            <button
                className="button gallery-open"
                type="button"
                onClick={() => setOpen(true)}
            >
                Lihat semua gambar <ChevronRight aria-hidden="true" />
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="gallery-modal">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {images.length} dokumentasi tersedia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="gallery-modal-scroll">
                        {images.map((image, index) => (
                            <figure key={image.id || index}>
                                <img
                                    src={asset(image.image)}
                                    alt={
                                        image.caption || `${title} ${index + 1}`
                                    }
                                />
                                <figcaption>{image.caption}</figcaption>
                            </figure>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function usePublicSettings(): Settings {
    return (usePage().props.settings as Settings | undefined) ?? {};
}

function whatsappUrl(number?: string) {
    const normalized = (number || '6281222229090').replace(/\D/g, '');
    return `https://wa.me/${normalized}`;
}

export function PublicSelect({
    name,
    defaultValue = 'all',
    label,
    options,
}: {
    name: string;
    defaultValue?: string;
    label: string;
    options: { value: string; label: string }[];
}) {
    return (
        <Select name={name} defaultValue={defaultValue || 'all'}>
            <SelectTrigger className="public-select" aria-label={label}>
                <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent className="public-select-content">
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function SiteHeader({ active = '' }: { active?: string }) {
    const [open, setOpen] = useState(false);
    const settings = usePublicSettings();
    const links = [
        ['Home', 'Beranda', '/'],
        ['Sports', 'Olahraga', '/sports'],
        ['Facilities', 'Venue & Booking', '/facilities'],
        ['Events', 'Acara', '/events'],
        ['Blog', 'Kabar', '/kabar'],
    ];

    return (
        <header className="site-header">
            <Link
                href="/"
                className="header-brand"
                aria-label="GGM Majalengka home"
            >
                <img
                    src="/assets/ilustrasi/logo-ggm.png"
                    alt="Gelanggang Generasi Muda Talaga Manggung Majalengka"
                />
            </Link>
            <button
                className="mobile-toggle"
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-label={open ? 'Tutup navigasi' : 'Buka navigasi'}
                aria-expanded={open}
                aria-controls="primary-navigation"
            >
                {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
            <nav
                id="primary-navigation"
                className={open ? 'nav open' : 'nav'}
                aria-label="Navigasi utama"
                data-tour="public-navigation"
            >
                {links.map(([key, label, href]) => (
                    <Link
                        key={href}
                        href={href}
                        className={active === key ? 'active' : ''}
                        aria-current={active === key ? 'page' : undefined}
                        onClick={() => setOpen(false)}
                    >
                        {label}
                    </Link>
                ))}
                <Link
                    className="header-contact"
                    href="/login"
                    onClick={() => setOpen(false)}
                    data-tour="public-contact"
                >
                    Masuk
                </Link>
            </nav>
        </header>
    );
}

export function SiteFooter() {
    const settings = usePublicSettings();
    const instagram = settings.instagram?.startsWith('http')
        ? settings.instagram
        : `https://instagram.com/${settings.instagram || 'ggmmajalengka'}`;
    const facebook =
        settings.facebook || 'https://www.facebook.com/ggmmajalengka';
    const youtube =
        settings.youtube ||
        'https://www.youtube.com/results?search_query=GGM+Majalengka';
    const tiktok =
        settings.tiktok || 'https://www.tiktok.com/search?q=GGM%20Majalengka';

    return (
        <footer className="footer" data-tour="public-footer">
            <div className="footer-about">
                <Link
                    href="/"
                    className="footer-logo"
                    aria-label="Beranda GGM Majalengka"
                >
                    <img
                        src="/assets/ilustrasi/logo-ggm.png"
                        alt="Gelanggang Generasi Muda Talaga Manggung Majalengka"
                    />
                </Link>
                <p>
                    Temukan olahraga favoritmu dan ruang terbaik untuk bergerak.
                </p>
            </div>
            <div className="footer-contact-info">
                <strong>Kunjungi GGM</strong>
                <address>
                    <span>
                        <MapPin aria-hidden="true" />
                        {settings.address ||
                            'Jl. Abdul Halim, Majalengka, Jawa Barat'}
                    </span>
                    <a href={`tel:${settings.phone || '+6281222229090'}`}>
                        <Phone aria-hidden="true" />
                        {settings.phone || '+62 812 2222 9090'}
                    </a>
                    <a
                        href={`mailto:${settings.email || 'halo@ggm-majalengka.id'}`}
                    >
                        <Mail aria-hidden="true" />
                        {settings.email || 'halo@ggm-majalengka.id'}
                    </a>
                </address>
            </div>
            <nav className="footer-links" aria-label="Navigasi footer">
                <strong>Jelajahi</strong>
                <Link href="/facilities">Venue &amp; Booking</Link>
                <Link href="/sports">Olahraga</Link>
                <Link href="/events">Acara</Link>
                <Link href="/kabar">Kabar</Link>
            </nav>
            <div className="footer-social">
                <strong>Terhubung dengan Kami</strong>
                <a
                    className="social-whatsapp"
                    href={whatsappUrl(settings.whatsapp || settings.phone)}
                >
                    <MessageCircle aria-hidden="true" /> WhatsApp
                </a>
                <a
                    className="social-instagram"
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                >
                    <Instagram aria-hidden="true" /> Instagram
                </a>
                <a
                    className="social-facebook"
                    href={facebook}
                    target="_blank"
                    rel="noreferrer"
                >
                    <Facebook aria-hidden="true" /> Facebook
                </a>
                <a
                    className="social-youtube"
                    href={youtube}
                    target="_blank"
                    rel="noreferrer"
                >
                    <Youtube aria-hidden="true" /> YouTube
                </a>
                <a
                    className="social-tiktok"
                    href={tiktok}
                    target="_blank"
                    rel="noreferrer"
                >
                    <Music2 aria-hidden="true" /> TikTok
                </a>
            </div>
            <small>
                &copy; 2026 Smart Sport UNMA. Seluruh hak cipta dilindungi.
            </small>
        </footer>
    );
}

export function Shell({
    active,
    children,
    showBookingPrompt = true,
}: {
    active?: string;
    children: React.ReactNode;
    showBookingPrompt?: boolean;
}) {
    return (
        <>
            <a className="skip-link" href="#main-content">
                Lewati ke konten utama
            </a>
            <SiteHeader active={active} />
            <main id="main-content" data-tour="public-content">{children}</main>
            {showBookingPrompt && (
                <section className="public-booking-prompt" aria-labelledby="public-booking-prompt-title">
                    <div className="public-booking-prompt-copy">
                        <span className="public-booking-prompt-eyebrow">BOOKING VENUE GGM</span>
                        <h2 id="public-booking-prompt-title">Sudah punya rencana olahraga?</h2>
                        <p>Cari venue yang cocok, cek jadwal yang tersedia, lalu pesan dan lanjutkan pembayaran secara online.</p>
                    </div>
                    <Link className="button public-booking-prompt-action" href="/facilities">
                        Cari venue &amp; cek jadwal <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                </section>
            )}
            <SiteFooter />
            <ProductTour
                storageKey="ggm-public-product-tour-v1"
                steps={[
                    { target: '[data-tour="public-navigation"]', title: 'Jelajahi GGM', description: 'Gunakan menu ini untuk menemukan olahraga, fasilitas, acara, dan kabar terbaru.' },
                    { target: '#main-content > section:first-of-type', title: 'Temukan informasi utama', description: 'Konten halaman menampilkan informasi lengkap yang bisa Anda jelajahi sesuai kebutuhan.' },
                    { target: '[data-tour="public-contact"]', title: 'Masuk & mulai booking', description: 'Masuk ke akun untuk melanjutkan pemesanan venue dan mengelola booking Anda.' },
                    { target: '[data-tour="public-footer"]', title: 'Informasi GGM', description: 'Alamat, kontak, dan kanal media sosial tersedia di bagian bawah setiap halaman.' },
                ]}
            />
        </>
    );
}

export function Eyebrow({ children }: { children?: React.ReactNode }) {
    if (!children) return null;
    return (
        <div className="eyebrow">
            <i aria-hidden="true" />
            {children}
        </div>
    );
}

export function SectionTitle({
    eyebrow,
    title,
    accent,
    copy,
    href,
    link,
}: {
    eyebrow?: string;
    title: string;
    accent?: string;
    copy?: string;
    href?: string;
    link?: string;
}) {
    const accentIndex = accent ? title.lastIndexOf(accent) : -1;

    return (
        <div className="section-title">
            <div>
                <Eyebrow>{eyebrow}</Eyebrow>
                <h2>
                    {accentIndex >= 0 ? (
                        <>
                            {title.slice(0, accentIndex)}
                            <span className="title-accent">{accent}</span>
                            {title.slice(accentIndex + accent!.length)}
                        </>
                    ) : (
                        title
                    )}
                </h2>
                {copy && <RichText html={copy} className="section-title-copy" />}
            </div>
            {href && (
                <Link href={href} className="text-link">
                    {link || 'Lihat semua'}{' '}
                    <ChevronRight size={14} aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}

export function FacilityCard({
    facility,
    variant = 'default',
}: {
    facility: any;
    variant?: 'default' | 'featured';
}) {
    return (
        <Link
            href={`/facilities/${facility.slug}`}
            className={`facility-card ${variant === 'featured' ? 'facility-card-featured' : ''}`}
        >
            <img
                src={asset(facility.thumbnail || facility.hero_image)}
                alt={`Fasilitas ${facility.name}`}
                loading={variant === 'featured' ? 'eager' : 'lazy'}
                decoding="async"
            />
            <div>
                <span className={`facility-booking-status ${facility.booking_enabled ? 'is-online' : 'is-contact'}`}>
                    <span aria-hidden="true" />
                    {facility.booking_enabled ? 'Booking online tersedia' : 'Reservasi via WhatsApp'}
                </span>
                <h3>{facility.name}</h3>
                <p className="muted">
                    {facility.subtitle || facility.venue_type}
                </p>
                <p>{plainText(facility.description)}</p>
                <div className="chips">
                    {(facility.sports || []).slice(0, 4).map((sport: any) => (
                        <span key={sport.id}>{sport.name}</span>
                    ))}
                </div>
                <span className="card-action">
                    {facility.booking_enabled ? 'Cek jadwal & pesan' : 'Lihat info reservasi'}{' '}
                    <ChevronRight size={14} aria-hidden="true" />
                </span>
            </div>
            {variant === 'featured' && (
                <>
                    <span className="facility-card-icon" aria-hidden="true">
                        <ArrowUpRight />
                    </span>
                    <strong className="facility-vertical-title">
                        {facility.name}
                    </strong>
                </>
            )}
        </Link>
    );
}

export function EventCard({
    event,
    variant = 'default',
}: {
    event: any;
    variant?: 'default' | 'featured';
}) {
    const eventDate = new Date(event.starts_at);

    return (
        <Link
            href={`/events/${event.slug}`}
            className={`event-card ${variant === 'featured' ? 'event-card-featured' : ''}`}
        >
            <div className="event-image">
                <img
                    src={asset(event.image || event.sport?.image)}
                    alt={`Acara ${event.title}`}
                    loading={variant === 'featured' ? 'eager' : 'lazy'}
                    decoding="async"
                />
                <span className="event-date">
                    {variant === 'featured' ? (
                        <>
                            <b>
                                {eventDate.toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                })}
                            </b>
                            <small>
                                {eventDate.toLocaleDateString('id-ID', {
                                    month: 'short',
                                })}
                            </small>
                        </>
                    ) : (
                        eventDate.toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                        })
                    )}
                </span>
            </div>
            <div>
                <Eyebrow>{event.sport?.name || 'Acara komunitas'}</Eyebrow>
                <h3>{event.title}</h3>
                <p>
                    <MapPin size={13} aria-hidden="true" />{' '}
                    {event.facility?.name || 'GGM Majalengka'}
                </p>
                <strong className="card-action">
                    Lihat acara <ChevronRight size={14} aria-hidden="true" />
                </strong>
            </div>
        </Link>
    );
}

function sportIcon(sport: any) {
    const identity = `${sport.slug || ''} ${sport.name || ''}`.toLowerCase();

    if (identity.includes('basket')) return CircleDotDashed;
    if (identity.includes('badminton')) return BicepsFlexed;
    if (identity.includes('volley')) return Volleyball;
    if (identity.includes('futsal') || identity.includes('football'))
        return Goal;
    if (identity.includes('karate')) return Shirt;
    if (identity.includes('jog') || identity.includes('run')) return Footprints;

    return Activity;
}

export function SportCard({
    sport,
    variant = 'compact',
}: {
    sport: any;
    variant?: 'compact' | 'discovery';
}) {
    const Icon = sportIcon(sport);

    return (
        <Link
            href={`/sports/${sport.slug}`}
            className={`sport-card ${variant === 'discovery' ? 'sport-card-discovery' : ''}`}
        >
            <div className="sport-icon" aria-hidden="true">
                {variant === 'discovery' ? <Icon /> : '✦'}
            </div>
            <div className="sport-card-copy">
                <strong>{sport.name}</strong>
                <small>{sport.court_type || 'Arena dalam ruangan'}</small>
            </div>
            {variant === 'discovery' && (
                <span className="sport-card-arrow" aria-hidden="true">
                    <ChevronRight />
                </span>
            )}
        </Link>
    );
}

export function CTA({
    title = 'Siap Berlatih atau Mengadakan Turnamen di GGM?',
    copy = 'Hubungi pengelola fasilitas untuk memeriksa jadwal lapangan kosong, koordinasi lampu arena, serta izin kegiatan olahraga komunitas.',
    illustrated = false,
    eyebrow,
    buttonLabel = 'Hubungi untuk reservasi',
}: {
    title?: string;
    copy?: string;
    illustrated?: boolean;
    eyebrow?: string;
    buttonLabel?: string;
}) {
    const settings = usePublicSettings();

    if (illustrated) {
        return (
            <section
                className="cta cta-illustrated"
                aria-labelledby="booking-heading"
                style={{
                    backgroundImage: "url('/assets/ilustrasi/bg-2.png')",
                }}
            >
                <div className="cta-copy">
                    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
                    <h2 id="booking-heading">{title}</h2>
                    <RichText html={copy} />
                </div>
                <img
                    className="cta-character"
                    src="/assets/ilustrasi/karakter-1.png"
                    alt=""
                    aria-hidden="true"
                />
                <div className="cta-booking-action">
                    {eyebrow && <span>{eyebrow}</span>}
                    <a
                        className="button lime"
                        href={whatsappUrl(settings.whatsapp || settings.phone)}
                    >
                        {buttonLabel}{' '}
                        <ChevronRight size={18} aria-hidden="true" />
                    </a>
                </div>
            </section>
        );
    }

    return (
        <section className="cta" aria-labelledby="booking-heading">
            <div>
                <div>
                    <h2 id="booking-heading">{title}</h2>
                    <RichText html={copy} />
                </div>
                <a
                    className="button lime"
                    href={whatsappUrl(settings.whatsapp || settings.phone)}
                >
                    {buttonLabel}{' '}
                    <ChevronRight size={16} aria-hidden="true" />
                </a>
            </div>
        </section>
    );
}

export function BookingLink({
    children,
    className = 'button',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const settings = usePublicSettings();
    return (
        <a
            className={className}
            href={whatsappUrl(settings.whatsapp || settings.phone)}
        >
            {children}
        </a>
    );
}

export function Breadcrumb({ items }: { items: string[] }) {
    const hrefs: Record<string, string> = {
        Facilities: '/facilities',
        Sports: '/sports',
        Events: '/events',
        Blog: '/kabar',
    };
    const labels: Record<string, string> = {
        Facilities: 'Fasilitas',
        Sports: 'Olahraga',
        Events: 'Acara',
        Blog: 'Kabar',
    };
    return (
        <nav className="breadcrumb" aria-label="Jejak navigasi">
            <ol>
                <li>
                    <Link href="/">Beranda</Link>
                </li>
                {items.map((item, index) => (
                    <li
                        key={item}
                        aria-current={
                            index === items.length - 1 ? 'page' : undefined
                        }
                    >
                        {index < items.length - 1 && hrefs[item] ? (
                            <Link href={hrefs[item]}>
                                {labels[item] || item}
                            </Link>
                        ) : (
                            item
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export function EmptyState({
    title,
    copy,
    href,
    action,
}: {
    title: string;
    copy: string;
    href?: string;
    action?: string;
}) {
    return (
        <div className="empty-state" role="status">
            <h3>{title}</h3>
            <p>{copy}</p>
            {href && (
                <Link className="text-link" href={href}>
                    {action || 'Hapus penyaring'}{' '}
                    <ChevronRight size={14} aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}

export function ReviewForm() {
    const { flash } = usePage().props as { flash?: { success?: string } };
    const form = useForm({ name: '', organization: '', rating: 5, review: '' });
    const errors = Object.entries(form.errors);

    return (
        <form
            className="review-form"
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                form.post('/testimonials', {
                    preserveScroll: true,
                    onSuccess: () => form.reset(),
                });
            }}
        >
            <div className="form-heading">
                <div>
                    <h3>Bagikan pengalaman Anda</h3>
                    <p>
                        Tulis ulasan dan pengalaman Anda setelah menggunakan
                        fasilitas olahraga di Majalengka. Ulasan akan
                        ditampilkan setelah melalui proses moderasi.
                    </p>
                </div>
            </div>
            {flash?.success && (
                <div className="form-success" role="status">
                    <CheckCircle2 aria-hidden="true" /> {flash.success}
                </div>
            )}
            {errors.length > 0 && (
                <div className="error-summary" role="alert" tabIndex={-1}>
                    <strong>Mohon periksa kembali ulasan Anda.</strong>
                    <ul>
                        {errors.map(([field, message]) => (
                            <li key={field}>
                                <a href={`#review-${field}`}>{message}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="form-row">
                <label htmlFor="review-name">
                    <span className="field-label">
                        Nama <span aria-hidden="true">*</span>
                    </span>
                    <input
                        id="review-name"
                        autoComplete="name"
                        placeholder="Masukkan nama Anda"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        aria-invalid={Boolean(form.errors.name)}
                        aria-describedby={
                            form.errors.name ? 'review-name-error' : undefined
                        }
                    />
                    {form.errors.name && (
                        <span className="form-error" id="review-name-error">
                            {form.errors.name}
                        </span>
                    )}
                </label>
                <label htmlFor="review-organization">
                    <span className="field-label">
                        Komunitas / Cabang Olahraga
                    </span>
                    <input
                        id="review-organization"
                        autoComplete="organization"
                        placeholder="Contoh: Komunitas Basket Majalengka"
                        value={form.data.organization}
                        onChange={(event) =>
                            form.setData('organization', event.target.value)
                        }
                        aria-invalid={Boolean(form.errors.organization)}
                        aria-describedby={
                            form.errors.organization
                                ? 'review-organization-error'
                                : undefined
                        }
                    />
                    {form.errors.organization && (
                        <span
                            className="form-error"
                            id="review-organization-error"
                        >
                            {form.errors.organization}
                        </span>
                    )}
                </label>
            </div>
            <fieldset className="rating-field">
                <legend>
                    Penilaian <span aria-hidden="true">*</span>
                </legend>
                <div className="rating-options">
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating}>
                            <input
                                type="radio"
                                name="rating"
                                value={rating}
                                checked={form.data.rating === rating}
                                onChange={() => form.setData('rating', rating)}
                            />
                            <Star
                                aria-hidden="true"
                                fill={
                                    form.data.rating >= rating
                                        ? 'currentColor'
                                        : 'none'
                                }
                            />
                            <span className="sr-only">{rating} bintang</span>
                        </label>
                    ))}
                </div>
                {form.errors.rating && (
                    <span className="form-error">{form.errors.rating}</span>
                )}
            </fieldset>
            <label htmlFor="review-review">
                <span className="field-label">
                    Ulasan <span aria-hidden="true">*</span>
                </span>
                <textarea
                    id="review-review"
                    rows={5}
                    maxLength={500}
                    placeholder="Ceritakan fasilitas, kesan, atau saran apa yang Anda alami ..."
                    value={form.data.review}
                    onChange={(event) =>
                        form.setData('review', event.target.value)
                    }
                    aria-invalid={Boolean(form.errors.review)}
                    aria-describedby="review-hint review-review-error"
                />
                <span className="field-hint" id="review-hint">
                    <span>
                        Jelaskan fasilitas, acara, atau aktivitas yang Anda
                        alami di Majalengka.
                    </span>
                    <span>{form.data.review.length}/500</span>
                </span>
                {form.errors.review && (
                    <span className="form-error" id="review-review-error">
                        {form.errors.review}
                    </span>
                )}
            </label>
            <button
                className="button"
                type="submit"
                disabled={form.processing}
                aria-disabled={form.processing}
            >
                {form.processing ? (
                    <>
                        <LoaderCircle
                            className="spinner"
                            size={16}
                            aria-hidden="true"
                        />{' '}
                        Sedang mengirim...
                    </>
                ) : (
                    <>
                        Kirim ulasan{' '}
                        <ChevronRight size={14} aria-hidden="true" />
                    </>
                )}
            </button>
        </form>
    );
}

export { CalendarDays, MapPin, Search, Star };
