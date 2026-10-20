import { Link, useForm } from '@inertiajs/react';
import { CalendarDays, ChevronRight, Printer, RotateCcw, Star } from 'lucide-react';
import { UserShell } from '@/components/user-layout';
import type { FormEvent } from 'react';
import '../../../css/admin-booking-refunds.css';
import { BookingStatusBadge } from '@/components/booking-status-badge';

const formatBookingDate = (value?: string | null) => {
    if (!value) return 'Tanggal belum tersedia';
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

function BookingReviewForm({ booking }: { booking: any }) {
    const form = useForm({ rating: 5, review: '' });

    return (
        <form
            className="booking-review-form"
            onSubmit={(event) => {
                event.preventDefault();
                form.post(`/bookings/${booking.encrypted_id || booking.id}/review`, {
                    preserveScroll: true,
                });
            }}
        >
            <div className="booking-review-title">
                <div>
                    <strong>Bagaimana pengalamanmu?</strong>
                    <p>Ulasan hanya tersedia setelah pembayaran lunas dan waktu booking selesai.</p>
                </div>
                <div className="booking-review-stars" role="group" aria-label="Pilih rating">
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                            type="button"
                            key={rating}
                            aria-label={`${rating} bintang`}
                            aria-pressed={form.data.rating === rating}
                            className={rating <= form.data.rating ? 'selected' : ''}
                            onClick={() => form.setData('rating', rating)}
                        >
                            <Star aria-hidden="true" />
                        </button>
                    ))}
                </div>
            </div>
            <label htmlFor={`booking-review-${booking.id}`}>Ulasan kamu</label>
            <textarea
                id={`booking-review-${booking.id}`}
                value={form.data.review}
                onChange={(event) => form.setData('review', event.target.value)}
                placeholder="Ceritakan pengalaman menggunakan fasilitas ini..."
                rows={3}
                maxLength={1000}
                required
            />
            {form.errors.rating && <p className="booking-review-error">{form.errors.rating}</p>}
            {form.errors.review && <p className="booking-review-error">{form.errors.review}</p>}
            <button type="submit" className="button booking-review-submit" disabled={form.processing || form.data.review.trim().length < 5}>
                {form.processing ? 'Mengirim ulasan...' : 'Kirim ulasan'}
            </button>
        </form>
    );
}

function BookingRefundRequestAction({ booking }: { booking: any }) {
    const form = useForm({ reason: '' });
    const refundErrors = form.errors as Record<string, string | undefined>;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(`/bookings/${booking.encrypted_id || booking.id}/refund-request`, {
            preserveScroll: true,
        });
    };

    if (booking.refund_request_status === 'pending') {
        return <p className="booking-refund-request-pending">Pengajuan refund sedang menunggu peninjauan admin.</p>;
    }

    if (!booking.can_request_refund) return null;

    return (
        <div className="booking-refund-request-action">
            <form onSubmit={submit}>
                <button type="submit" className="button booking-refund-request-button" disabled={form.processing}>
                    <RotateCcw aria-hidden="true" size={16} />
                    {form.processing ? 'Mengirim pengajuan…' : 'Ajukan refund'}
                </button>
                {refundErrors.refund && <p className="booking-refund-request-error">{refundErrors.refund}</p>}
            </form>
            <p className="booking-refund-request-hint">
                Pengajuan ini belum menentukan nominal. Admin akan meninjau dan menentukan nominal sesuai kebijakan yang berlaku.{' '}
                <Link href="/refund-policy">Baca kebijakan refund</Link>.
            </p>
        </div>
    );
}

export default function Bookings({ bookings }: any) {
    return (
        <UserShell active="bookings" title="Riwayat Pemesanan" description="Lihat seluruh pemesanan venue, status pembayaran, dan berikan ulasan setelah menggunakan fasilitas.">
            <section className="user-panel">
                {bookings.data.length ? <div className="user-history-list">{bookings.data.map((booking: any) => {
                    const isDaily = (booking.booking_mode || 'hourly') === 'daily';
                    return (
                        <article className="user-history-card" key={booking.id}>
                            <div className="user-history-main">
                                <div className="user-booking-icon"><CalendarDays /></div>
                                <div>
                                    <span className="eyebrow"><i /> {booking.booking_number}</span>
                                    <h3>{booking.facility?.name}</h3>
                                    <p>{isDaily ? `${formatBookingDate(booking.booking_date)} – ${formatBookingDate(booking.booking_end_date || booking.booking_date)} · Per hari` : `${formatBookingDate(booking.booking_date)} · ${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}`}</p>
                                </div>
                            </div>
                            <div className="user-history-side">
                                <BookingStatusBadge status={booking.status} />
                                <strong>Rp {Number(booking.total).toLocaleString('id-ID')}</strong>
                                <Link href={'/booking/' + (booking.encrypted_id || booking.id) + '/status'} className="text-link">Detail <ChevronRight /></Link>
                                <BookingRefundRequestAction booking={booking} />
                                {booking.invoice && booking.invoice_print_url && ['PAID', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(String(booking.payment?.payment_status || '')) && (
                                    <a
                                        href={booking.invoice_print_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="button booking-invoice-print"
                                    >
                                        <Printer aria-hidden="true" size={16} /> Cetak invoice
                                    </a>
                                )}
                            </div>
                            {booking.review ? (
                                <div className="booking-review-existing">
                                    <div className="booking-review-existing-stars">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={n <= Number(booking.review.rating) ? 'selected' : ''} />)}</div>
                                    <div><strong>Ulasan sudah dikirim</strong><p>{booking.review.review}</p><small>Status: {booking.review.status === 'approved' ? 'Ditampilkan' : booking.review.status === 'rejected' ? 'Ditolak admin' : 'Menunggu moderasi admin'}</small></div>
                                </div>
                            ) : booking.can_review ? <BookingReviewForm booking={booking} /> : null}
                        </article>
                    );
                })}</div> : <div className="user-empty"><CalendarDays /><strong>Belum ada riwayat booking</strong><p>Yuk, pilih venue dan buat booking pertama kamu.</p><Link href="/booking" className="button">Cari venue</Link></div>}
                {bookings.links?.length > 3 && <nav className="booking-pagination user-pagination">{bookings.links.map((link: any, index: number) => link.url ? <Link key={index} href={link.url} className={link.active ? 'active' : ''} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={index} dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>}
            </section>
        </UserShell>
    );
}
