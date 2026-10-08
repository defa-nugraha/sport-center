import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CreditCard, FileText, UserRound } from 'lucide-react';

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

export default function Show({ booking }: { booking: any }) {
    const status = booking.status;
    const paymentStatus = booking.payment?.payment_status;

    return (
        <div className="admin-shell">
            <Head title={`Booking ${booking.booking_number}`} />
            <AdminSidebar active="bookings" />
            <main className="admin-main">
                <AdminTopbar
                    eyebrow="Kelola booking"
                    title={booking.booking_number}
                    description="Detail pemesanan dan informasi pembayaran pelanggan."
                />

                <Link className="booking-back-link" href="/admin/bookings">
                    <ArrowLeft aria-hidden="true" />
                    Kembali ke daftar booking
                </Link>

                <div className="booking-detail-grid">
                    <section className="admin-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Informasi booking</h2>
                                <p>Detail venue dan jadwal yang dipesan.</p>
                            </div>
                            <CalendarDays aria-hidden="true" />
                        </div>
                        <div className="booking-detail-list">
                            <div>
                                <span>Customer</span>
                                <strong>{booking.customer_name}</strong>
                            </div>
                            <div>
                                <span>No. telepon</span>
                                <strong>{booking.customer_phone || '-'}</strong>
                            </div>
                            <div>
                                <span>Venue</span>
                                <strong>{booking.facility?.name || '-'}</strong>
                            </div>
                            <div>
                                <span>Mode booking</span>
                                <strong>{booking.booking_mode === 'daily' ? 'Per hari' : 'Per jam'}</strong>
                            </div>
                            <div>
                                <span>{booking.booking_mode === 'daily' ? 'Rentang tanggal' : 'Tanggal'}</span>
                                <strong>
                                    {new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                    {booking.booking_mode === 'daily' && booking.booking_end_date && (
                                        <> – {new Date(`${booking.booking_end_date}T00:00:00`).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                        })}</>
                                    )}
                                </strong>
                            </div>
                            {booking.booking_mode !== 'daily' && (
                                <div>
                                    <span>Waktu</span>
                                    <strong>{booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</strong>
                                </div>
                            )}
                            <div>
                                <span>Total</span>
                                <strong className="booking-detail-total">
                                    {formatCurrency(booking.total)}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="admin-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Status</h2>
                                <p>Status booking dan pembayaran saat ini.</p>
                            </div>
                            <CreditCard aria-hidden="true" />
                        </div>
                        <div className="booking-detail-status">
                            <div>
                                <span>Status booking</span>
                                <strong className={`booking-status ${statusClasses[status] || ''}`}>
                                    {statusLabels[status] || status}
                                </strong>
                            </div>
                            <div>
                                <span>Status pembayaran</span>
                                <strong>{paymentStatus || 'Belum tersedia'}</strong>
                            </div>
                            <div>
                                <span>Order ID Midtrans</span>
                                <strong>{booking.payment?.order_id || '-'}</strong>
                            </div>
                            <div>
                                <span>No. invoice</span>
                                <strong>{booking.invoice?.invoice_number || '-'}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="admin-panel booking-detail-customer">
                        <div className="panel-head">
                            <div>
                                <h2>Customer</h2>
                                <p>Informasi akun pelanggan yang terkait.</p>
                            </div>
                            <UserRound aria-hidden="true" />
                        </div>
                        <div className="booking-customer-card">
                            <div className="booking-customer-avatar">
                                <UserRound aria-hidden="true" />
                            </div>
                            <div>
                                <strong>{booking.user?.name || booking.customer_name}</strong>
                                <span>{booking.user?.email || '-'}</span>
                                <span>{booking.customer_phone || '-'}</span>
                            </div>
                        </div>
                    </section>

                    <section className="admin-panel booking-detail-invoice">
                        <div className="panel-head">
                            <div>
                                <h2>Invoice</h2>
                                <p>Referensi dokumen untuk transaksi booking.</p>
                            </div>
                            <FileText aria-hidden="true" />
                        </div>
                        <div className="booking-invoice-box">
                            <span>No. invoice</span>
                            <strong>{booking.invoice?.invoice_number || 'Belum dibuat'}</strong>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
