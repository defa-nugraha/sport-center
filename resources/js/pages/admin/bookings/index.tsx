import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { CalendarDays, Check, Clock3, Settings2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: 'Menunggu pembayaran',
    CONFIRMED: 'Dikonfirmasi',
    FAILED: 'Gagal',
    EXPIRED: 'Kedaluwarsa',
    CANCELLED: 'Dibatalkan',
    COMPLETED: 'Selesai',
};

const statusClasses: Record<string, string> = {
    PENDING_PAYMENT: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
};

function formatCurrency(value: number | string) {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

function FacilityBookingSettings({ facility }: { facility: any }) {
    const form = useForm({
        booking_enabled: Boolean(facility.booking_enabled),
        booking_price_per_hour: facility.booking_price_per_hour ?? '',
        booking_min_hours: facility.booking_min_hours ?? 1,
    });

    return (
        <form
            className="booking-facility-card"
            onSubmit={(event) => {
                event.preventDefault();
                form.put(`/admin/bookings/facilities/${facility.id}`, {
                    preserveScroll: true,
                });
            }}
        >
            <div className="booking-facility-heading">
                <div className="booking-facility-icon">
                    <Settings2 aria-hidden="true" />
                </div>
                <div>
                    <h3>{facility.name}</h3>
                    <p>Atur harga dan ketersediaan booking venue.</p>
                </div>
            </div>
            <div className="booking-facility-fields">
                <label>
                    Harga per jam
                    <div className="booking-price-input">
                        <span>Rp</span>
                        <input
                            type="number"
                            min="1"
                            value={form.data.booking_price_per_hour}
                            onChange={(event) =>
                                form.setData(
                                    'booking_price_per_hour',
                                    Number(event.target.value),
                                )
                            }
                        />
                    </div>
                </label>
                <label>
                    Minimal durasi
                    <div className="booking-price-input">
                        <input
                            type="number"
                            min="1"
                            max="12"
                            step="1"
                            value={form.data.booking_min_hours}
                            onChange={(event) =>
                                form.setData(
                                    'booking_min_hours',
                                    Number(event.target.value),
                                )
                            }
                        />
                        <span>jam</span>
                    </div>
                </label>
                <label className="booking-toggle">
                    <input
                        type="checkbox"
                        checked={form.data.booking_enabled}
                        onChange={(event) =>
                            form.setData(
                                'booking_enabled',
                                event.target.checked,
                            )
                        }
                    />
                    <span>
                        <strong>Booking aktif</strong>
                        <small>Venue dapat dipesan pelanggan.</small>
                    </span>
                </label>
                <button
                    type="submit"
                    className="button small"
                    disabled={form.processing}
                >
                    <Check aria-hidden="true" />
                    {form.processing ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    );
}

export default function Index({
    bookings,
    facilities,
    statuses = [],
    filters = {},
}: {
    bookings: any;
    facilities: any[];
    statuses?: string[];
    filters?: { status?: string };
}) {
    const [status, setStatus] = useState(filters.status || 'all');

    return (
        <div className="admin-shell">
            <Head title="Kelola booking" />
            <AdminSidebar active="bookings" />
            <main className="admin-main">
                <AdminTopbar
                    title="Kelola Booking"
                    description="Kelola jadwal pemesanan, harga venue, dan status booking pelanggan."
                />

                <section className="admin-panel booking-settings-panel" id="settings">
                    <div className="panel-head">
                        <div>
                            <h2>Pengaturan venue</h2>
                            <p>
                                Atur harga per jam dan tentukan venue yang
                                tersedia untuk booking online.
                            </p>
                        </div>
                        <Clock3 aria-hidden="true" />
                    </div>
                    {facilities.length > 0 ? (
                        <div className="booking-facility-grid">
                            {facilities.map((facility) => (
                                <FacilityBookingSettings
                                    key={facility.id}
                                    facility={facility}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="booking-empty-state">
                            <Settings2 aria-hidden="true" />
                            <strong>Belum ada fasilitas</strong>
                            <p>
                                Tambahkan fasilitas terlebih dahulu agar dapat
                                digunakan untuk booking.
                            </p>
                            <Link className="text-link" href="/admin/content?tab=facilities">
                                Kelola fasilitas
                            </Link>
                        </div>
                    )}
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
                                            {statusLabels[statusOption] || statusOption}
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
                            <div className="booking-table-wrap">
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
                                            <tr key={booking.id}>
                                                <td>
                                                    <Link
                                                        className="booking-number"
                                                        href={`/admin/bookings/${booking.id}`}
                                                    >
                                                        {booking.booking_number}
                                                    </Link>
                                                    <small>
                                                        {booking.payment?.payment_status
                                                            ? `Pembayaran: ${booking.payment.payment_status}`
                                                            : 'Pembayaran belum tersedia'}
                                                    </small>
                                                </td>
                                                <td>
                                                    <strong>{booking.customer_name}</strong>
                                                    <small>{booking.customer_phone || '-'}</small>
                                                </td>
                                                <td>{booking.facility?.name || '-'}</td>
                                                <td>
                                                    <strong>
                                                        {new Date(
                                                            `${booking.booking_date}T${booking.start_time || '00:00'}`,
                                                        ).toLocaleDateString('id-ID', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </strong>
                                                    <small>
                                                        {booking.start_time?.slice(0, 5)} -{' '}
                                                        {booking.end_time?.slice(0, 5)}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`booking-status ${statusClasses[booking.status] || ''}`}
                                                    >
                                                        {statusLabels[booking.status] ||
                                                            booking.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>{formatCurrency(booking.total)}</strong>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
