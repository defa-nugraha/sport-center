import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { ProductTour, replayProductTour } from '@/components/product-tour';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, CircleHelp, Search, SlidersHorizontal, X } from 'lucide-react';
import { DateRangePicker } from '@/components/date-range-picker';
import '../../../../css/admin-booking-filters.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingStatusBadge, bookingStatusLabels } from '@/components/booking-status-badge';

function formatCurrency(value: number | string) {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function Index({
    bookings,
    statuses = [],
    paymentStatuses = [],
    facilities = [],
    filters = {},
}: {
    bookings: any;
    statuses?: string[];
    paymentStatuses?: string[];
    facilities?: Array<{ id: number | string; name: string }>;
    filters?: {
        search?: string;
        status?: string;
        payment_status?: string;
        facility_id?: string;
        booking_mode?: string;
        date_from?: string;
        date_to?: string;
    };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || 'all');
    const [facilityId, setFacilityId] = useState(filters.facility_id || 'all');
    const [bookingMode, setBookingMode] = useState(filters.booking_mode || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const hasActiveFilters = Boolean(
        search.trim()
        || status !== 'all'
        || paymentStatus !== 'all'
        || facilityId !== 'all'
        || bookingMode !== 'all'
        || dateFrom
        || dateTo
    );

    return (
        <div className="admin-shell">
            <Head title="Daftar booking" />
            <AdminSidebar active="bookings" />
            <main className="admin-main">
                <AdminTopbar
                    title="Daftar Booking"
                    description="Lihat, filter, dan kelola seluruh pemesanan venue pelanggan."
                    action={<button type="button" className="button secondary small" onClick={() => replayProductTour('ggm-admin-bookings-tour-v1')}><CircleHelp aria-hidden="true" /> Panduan</button>}
                />

                <section className="admin-panel booking-filter-panel" aria-labelledby="booking-filter-title">
                    <div className="booking-filter-panel-head">
                        <div>
                            <h2 id="booking-filter-title">Cari &amp; filter booking</h2>
                            <p>Temukan pesanan berdasarkan pelanggan, jadwal, venue, dan status pembayaran.</p>
                        </div>
                        <SlidersHorizontal aria-hidden="true" />
                    </div>

                    <form className="booking-filter booking-filter-advanced" method="get" action="/admin/bookings">
                        <div className="booking-filter-fields">
                            <label className="booking-filter-field booking-filter-field--wide">
                                Kata kunci
                                <span className="booking-filter-input-wrap">
                                    <Search size={16} aria-hidden="true" />
                                    <input
                                        type="search"
                                        name="search"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Nomor booking, nama, email, telepon, atau venue"
                                        autoComplete="off"
                                    />
                                </span>
                            </label>

                            <div className="booking-filter-field booking-filter-field--wide">
                                <span className="booking-filter-label">Rentang tanggal booking</span>
                                <DateRangePicker
                                    start={dateFrom}
                                    end={dateTo}
                                    mode="range"
                                    minDate="2000-01-01"
                                    initialDate={todayIso}
                                    onChange={(start, end) => {
                                        setDateFrom(start);
                                        setDateTo(end);
                                    }}
                                />
                                <small className="booking-filter-help">Termasuk booking harian yang jadwalnya beririsan dengan rentang ini.</small>
                            </div>

                            <label className="booking-filter-field">
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

                            <label className="booking-filter-field">
                                Venue
                                <input type="hidden" name="facility_id" value={facilityId === 'all' ? '' : facilityId} />
                                <Select value={facilityId} onValueChange={setFacilityId}>
                                    <SelectTrigger className="admin-select-trigger">
                                        <SelectValue placeholder="Semua venue" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua venue</SelectItem>
                                        {facilities.map((facility) => (
                                            <SelectItem key={facility.id} value={String(facility.id)}>
                                                {facility.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>

                            <label className="booking-filter-field">
                                Mode booking
                                <input type="hidden" name="booking_mode" value={bookingMode === 'all' ? '' : bookingMode} />
                                <Select value={bookingMode} onValueChange={setBookingMode}>
                                    <SelectTrigger className="admin-select-trigger">
                                        <SelectValue placeholder="Semua mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua mode</SelectItem>
                                        <SelectItem value="hourly">Per jam</SelectItem>
                                        <SelectItem value="daily">Per hari</SelectItem>
                                    </SelectContent>
                                </Select>
                            </label>

                            <label className="booking-filter-field">
                                Status pembayaran
                                <input type="hidden" name="payment_status" value={paymentStatus === 'all' ? '' : paymentStatus} />
                                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                    <SelectTrigger className="admin-select-trigger">
                                        <SelectValue placeholder="Semua pembayaran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua pembayaran</SelectItem>
                                        {paymentStatuses.map((paymentOption) => (
                                            <SelectItem key={paymentOption} value={paymentOption}>
                                                {{
                                                    PENDING: 'Menunggu pembayaran',
                                                    PAID: 'Lunas',
                                                    FAILED: 'Gagal',
                                                    EXPIRED: 'Kedaluwarsa',
                                                    CANCELLED: 'Dibatalkan',
                                                    REFUND_PENDING: 'Menunggu konfirmasi refund',
                                                    PARTIALLY_REFUNDED: 'Refund sebagian',
                                                    REFUNDED: 'Refund selesai',
                                                }[paymentOption] || paymentOption}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>
                        </div>

                        <input type="hidden" name="date_from" value={dateFrom} />
                        <input type="hidden" name="date_to" value={dateTo} />

                        <div className="booking-filter-actions">
                            <span className="booking-filter-summary">
                                <SlidersHorizontal size={15} aria-hidden="true" />
                                {bookings.total.toLocaleString('id-ID')} booking ditemukan
                            </span>
                            <div>
                                {hasActiveFilters && (
                                    <Link className="button secondary small" href="/admin/bookings">
                                        <X size={14} aria-hidden="true" /> Reset filter
                                    </Link>
                                )}
                                <button className="button small" type="submit">
                                    <Search size={15} aria-hidden="true" /> Terapkan filter
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

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
                            <strong>{hasActiveFilters ? 'Tidak ada booking yang cocok' : 'Belum ada booking'}</strong>
                            <p>
                                {hasActiveFilters
                                    ? 'Coba ubah kata kunci atau kurangi filter untuk melihat booking lainnya.'
                                    : 'Booking pelanggan akan muncul di sini setelah pemesanan dilakukan.'}
                            </p>
                            {hasActiveFilters && (
                                <Link className="text-button" href="/admin/bookings">Hapus semua filter</Link>
                            )}
                        </div>
                    )}
                </section>
            <ProductTour autoStart={false} storageKey="ggm-admin-bookings-tour-v1" steps={[
                { target: '.booking-filter-panel', title: 'Cari dan filter booking', description: 'Cari berdasarkan pelanggan, rentang tanggal, venue, status booking, mode, dan status pembayaran.' },
                { target: '.booking-list-panel', title: 'Daftar pemesanan', description: 'Tinjau jadwal, nilai transaksi, dan status setiap pemesanan. Buka Detail untuk tindakan lanjutan.' },
                { target: '.booking-number', title: 'Detail dan refund', description: 'Buka detail booking untuk memeriksa transaksi dan menggunakan tindakan refund jika memenuhi ketentuan.' },
            ]} />
            </main>
        </div>
    );
}
