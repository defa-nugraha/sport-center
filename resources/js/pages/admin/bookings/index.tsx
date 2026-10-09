import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingStatusBadge, bookingStatusLabels } from '@/components/booking-status-badge';

function formatCurrency(value: number | string) {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function Index({
    bookings,
    statuses = [],
    filters = {},
}: {
    bookings: any;
    statuses?: string[];
    filters?: { status?: string };
}) {
    const [status, setStatus] = useState(filters.status || 'all');

    return (
        <div className="admin-shell">
            <Head title="Daftar booking" />
            <AdminSidebar active="bookings" />
            <main className="admin-main">
                <AdminTopbar
                    title="Daftar Booking"
                    description="Lihat, filter, dan kelola seluruh pemesanan venue pelanggan."
                />

                <section className="admin-panel booking-list-panel" id="list">
                    <div className="panel-head booking-list-head">
                        <div>
                            <h2>Daftar booking</h2>
                            <p>
                                {bookings.total
                                    ? `${bookings.total.toLocaleString('id-ID')} booking tercatat.`
                                    : 'Belum ada booking yang tercatat.'}
                            </p>
                        </div>
                        <CalendarDays aria-hidden="true" />
                    </div>

                    <form className="booking-filter" method="get">
                        <label>
                            Status booking
                            <input type="hidden" name="status" value={status === 'all' ? '' : status} />
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="admin-select-trigger">
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua status</SelectItem>
                                    {statuses.map((statusOption) => (
                                        <SelectItem key={statusOption} value={statusOption}>
                                            {bookingStatusLabels[statusOption] || statusOption}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>
                        <button className="button small" type="submit">
                            Terapkan filter
                        </button>
                        {filters.status && (
                            <Link className="text-button" href="/admin/bookings">
                                Reset
                            </Link>
                        )}
                    </form>

                    {bookings.data.length > 0 ? (
                        <>
                            <div className="booking-table-wrap booking-table-desktop">
                                <table className="booking-table">
                                    <thead>
                                        <tr>
                                            <th>Booking</th>
                                            <th>Customer</th>
                                            <th>Venue</th>
                                            <th>Jadwal</th>
                                            <th>Status</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.data.map((booking: any) => (
                                            <tr key={booking.encrypted_id}>
                                                <td>
                                                    <Link className="booking-number" href={`/admin/bookings/${booking.encrypted_id}`}>
                                                        {booking.booking_number}
                                                    </Link>
                                                    <small>{booking.payment?.payment_status ? `Pembayaran: ${booking.payment.payment_status}` : 'Pembayaran belum tersedia'}</small>
                                                </td>
                                                <td><strong>{booking.customer_name}</strong><small>{booking.customer_phone || '-'}</small></td>
                                                <td>{booking.facility?.name || '-'}</td>
                                                <td>
                                                    <strong>
                                                        {new Date(booking.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        {booking.booking_mode === 'daily' && booking.booking_end_date && <> – {new Date(booking.booking_end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</>}
                                                    </strong>
                                                    <small>{booking.booking_mode === 'daily' ? 'Per hari' : `${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}`}</small>
                                                </td>
                                                <td><BookingStatusBadge status={booking.status} /></td>
                                                <td><strong>{formatCurrency(booking.total)}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="booking-mobile-list" aria-label="Daftar booking versi mobile">
                                {bookings.data.map((booking: any) => (
                                    <article className="booking-mobile-card" key={booking.encrypted_id}>
                                        <div className="booking-mobile-card-head">
                                            <Link className="booking-number" href={`/admin/bookings/${booking.encrypted_id}`}>{booking.booking_number}</Link>
                                            <BookingStatusBadge status={booking.status} />
                                        </div>
                                        <div className="booking-mobile-card-main">
                                            <div><span>Customer</span><strong>{booking.customer_name}</strong><small>{booking.customer_phone || '-'}</small></div>
                                            <div><span>Venue</span><strong>{booking.facility?.name || '-'}</strong></div>
                                            <div><span>Jadwal</span><strong>
                                                {new Date(booking.booking_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {booking.booking_mode === 'daily' && booking.booking_end_date && <> – {new Date(booking.booking_end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</>}
                                            </strong><small>{booking.booking_mode === 'daily' ? 'Per hari' : `${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}`}</small></div>
                                        </div>
                                        <div className="booking-mobile-card-footer">
                                            <div><span>Total</span><strong>{formatCurrency(booking.total)}</strong></div>
                                            <Link className="button small" href={`/admin/bookings/${booking.encrypted_id}`}>Detail</Link>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {bookings.links?.length > 3 && (
                                <div className="booking-pagination">
                                    {bookings.links.map((link: any, index: number) =>
                                        link.url ? (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={link.active ? 'active' : ''}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={index}
                                                className="disabled"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ),
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="booking-empty-state booking-empty-list">
                            <CalendarDays aria-hidden="true" />
                            <strong>Belum ada booking</strong>
                            <p>
                                Booking pelanggan akan muncul di sini setelah
                                pemesanan dilakukan.
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
