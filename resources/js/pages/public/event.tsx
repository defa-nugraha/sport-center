import { Head, Link } from '@inertiajs/react';
import { EventSkeleton, usePageLoading } from '@/components/page-skeletons';
import { ChevronRight, CalendarDays, CalendarPlus, Download, MapPin } from 'lucide-react';
import { RichText } from '@/components/rich-text-editor';
import {
    asset,
    BookingLink,
    Breadcrumb,
    EmptyState,
    EventCard,
    GalleryViewer,
    SectionTitle,
    Shell,
} from '@/components/public-site';

export default function Event({ event, moreEvents, sections = {} }: any) {
    const loading = usePageLoading();
    if (loading) return <EventSkeleton />;
    const date = new Date(event.starts_at);
    const end = new Date(event.ends_at || new Date(date.getTime() + 60 * 60 * 1000));
    const calendarDate = (value: Date) => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const calendarParams = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${calendarDate(date)}/${calendarDate(end)}`,
        details: String(event.description || '').replace(/<[^>]+>/g, ''),
        location: event.facility?.address || event.facility?.name || 'GGM Majalengka',
    });
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?${calendarParams.toString()}`;
    return (
        <Shell active="Events">
            <Head title={event.title} />
            <section className="page-section">
                <Breadcrumb items={['Events', event.title]} />
                <div className="event-detail-hero">
                    <div>
                        <div className="pill">
                            {event.sport?.name || 'Acara'}
                        </div>
                        <h1>{event.title}</h1>
                        <p className="event-meta">
                            <CalendarDays size={16} aria-hidden="true" />{' '}
                            {date.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                        <p className="event-meta">
                            <MapPin size={16} aria-hidden="true" />{' '}
                            {event.facility?.name || 'GGM Majalengka'}
                        </p>
                        <RichText html={event.description} />
                        <div className="event-booking-actions">
                            <BookingLink>
                                Tanya &amp; daftar acara{' '}
                                <ChevronRight size={15} aria-hidden="true" />
                            </BookingLink>
                            {event.facility?.booking_enabled && (
                                <Link className="button secondary" href={`/facilities/${event.facility.slug}`}>
                                    Cek &amp; pesan venue <ChevronRight size={15} aria-hidden="true" />
                                </Link>
                            )}
                        </div>
                        <div className="event-calendar-actions">
                            <a className="button secondary" href={googleCalendarUrl} target="_blank" rel="noreferrer">
                                <CalendarPlus aria-hidden="true" /> Tambahkan ke Google Calendar
                            </a>
                            <a className="text-link" href={`/events/${event.slug}/calendar.ics`}>
                                <Download aria-hidden="true" /> Unduh pengingat {event.reminder_enabled ? `H-${event.reminder_days_before}` : 'kalender'}
                            </a>
                        </div>
                    </div>
                    <img
                        src={asset(event.image || event.sport?.image)}
                        alt={`Acara ${event.title}`}
                        decoding="async"
                    />
                </div>
                <div className="event-stats">
                    <div>
                        <small>Tanggal</small>
                        <b>
                            {date.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </b>
                    </div>
                    <div>
                        <small>Olahraga</small>
                        <b>{event.sport?.name || 'Acara komunitas'}</b>
                    </div>
                    <div>
                        <small>Lokasi</small>
                        <b>{event.facility?.name || 'GGM Majalengka'}</b>
                    </div>
                    <div>
                        <small>Status</small>
                        <b>
                            <i aria-hidden="true" />{' '}
                            {{
                                upcoming: 'Akan datang',
                                ongoing: 'Sedang berlangsung',
                                completed: 'Selesai',
                                cancelled: 'Dibatalkan',
                                draft: 'Draf',
                            }[event.computed_status as string] ||
                                event.computed_status}
                        </b>
                    </div>
                </div>
            </section>
            <section className="page-section article">
                <h2>{sections.about?.title || 'Tentang Acara'}</h2>
                <RichText html={event.description} />
                {event.galleries?.length > 0 && (
                    <div className="event-gallery-block">
                        <h2>{sections.gallery?.title || 'Galeri Acara'}</h2>
                        <div className="gallery-grid">
                            {event.galleries.slice(0, 3).map((image: any) => (
                                <figure key={image.id}>
                                    <img
                                        src={asset(image.image)}
                                        alt={image.caption || event.title}
                                    />
                                    <figcaption>{image.caption}</figcaption>
                                </figure>
                            ))}
                        </div>
                        <GalleryViewer
                            images={event.galleries}
                            title={`Galeri ${event.title}`}
                        />
                    </div>
                )}
                <h2>{sections.location?.title || 'Lokasi Acara'}</h2>
                {event.facility ? (
                    <div className="host-card">
                        <div>
                            <div className="eyebrow">Fasilitas tuan rumah</div>
                            <h3>{event.facility.name}</h3>
                            <RichText html={event.facility.description} />
                            <Link
                                className="button"
                                href={`/facilities/${event.facility.slug}`}
                            >
                                Lihat fasilitas{' '}
                                <ChevronRight size={14} aria-hidden="true" />
                            </Link>
                        </div>
                        <img
                            src={asset(event.facility.hero_image)}
                            alt={event.facility.name}
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                ) : (
                    <EmptyState
                        title="Lokasi masih dikonfirmasi"
                        copy="Hubungi penyelenggara untuk mendapatkan informasi lokasi terbaru."
                    />
                )}
                <SectionTitle title={sections.related?.title || 'Acara Menarik Lainnya'} />
                {moreEvents.length ? (
                    <div className="event-grid">
                        {moreEvents.map((item: any) => (
                            <EventCard key={item.id} event={item} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Belum ada acara lainnya"
                        copy="Cek kembali kalender acara untuk melihat jadwal terbaru."
                        href="/events"
                        action="Lihat kalender acara"
                    />
                )}
            </section>
        </Shell>
    );
}
