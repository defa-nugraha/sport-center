import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ConfirmDialog, StatusDialog } from '@/components/admin-cms';
import { ArrowLeft, CalendarDays, CreditCard, FileText, UserRound, RotateCcw } from 'lucide-react';
import type { FormEvent } from 'react';
import '../../../../css/admin-booking-refunds.css';

const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: 'Menunggu pembayaran',
    CONFIRMED: 'Dikonfirmasi',
    FAILED: 'Gagal',
    EXPIRED: 'Kedaluwarsa',
    CANCELLED: 'Dibatalkan',
    COMPLETED: 'Selesai',
    REFUNDED: 'Refund selesai',
};

const statusClasses: Record<string, string> = {
    PENDING_PAYMENT: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    REFUNDED: 'refunded',
};

function formatCurrency(value: number | string) {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

export default function Show({ booking, refunds = [], canRefund = false, refundRemaining = 0, canPartialRefund = true }: { booking: any; refunds?: any[]; canRefund?: boolean; refundRemaining?: number; canPartialRefund?: boolean }) {
    const status = booking.status;
    const paymentStatus = booking.payment?.payment_status;
    const refundForm = useForm({ amount: String(refundRemaining), reason: '' });

    useEffect(() => {
        refundForm.setData('amount', String(refundRemaining));
    }, [refundRemaining]);
    const [confirmRefund, setConfirmRefund] = useState(false);
    const [statusDialog, setStatusDialog] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const refundErrors = refundForm.errors as Record<string, string | undefined>;

    const submitRefund = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setConfirmRefund(true);
    };

    const confirmRefundRequest = () => {
        setConfirmRefund(false);
        refundForm.post(`/admin/bookings/${booking.encrypted_id}/refund`, {
            preserveScroll: true,
            onSuccess: () => {
                refundForm.reset('reason');
                setStatusDialog({ type: 'success', message: 'Permintaan refund dikirim. Status akan diperbarui setelah ada konfirmasi dari Midtrans.' });
            },
            onError: (errors) => setStatusDialog({ type: 'error', message: Object.values(errors)[0] || 'Permintaan refund belum berhasil dikirim.' }),
        });
    };

    const paymentStatusLabels: Record<string, string> = {
        PENDING: 'Menunggu pembayaran',
        PAID: 'Lunas',
        FAILED: 'Gagal',
        EXPIRED: 'Kedaluwarsa',
        CANCELLED: 'Dibatalkan',
        REFUND_PENDING: 'Menunggu konfirmasi refund',
        PARTIALLY_REFUNDED: 'Refund sebagian',
        REFUNDED: 'Refund selesai',
    };

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
                                <strong>{paymentStatusLabels[paymentStatus] || paymentStatus || 'Belum tersedia'}</strong>
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

                    {refunds.length > 0 && (
                        <section className="admin-panel booking-refund-history">
                            <div className="panel-head">
                                <div>
                                    <h2>Riwayat refund</h2>
                                    <p>Permintaan refund dan konfirmasi dari Midtrans.</p>
                                </div>
                                <RotateCcw aria-hidden="true" />
                            </div>
                            <div className="booking-refund-list">
                                {refunds.map((refund: any) => (
                                    <article className="booking-refund-record" key={refund.id}>
                                        <div>
                                            <strong>{formatCurrency(refund.amount)}</strong>
                                            <span>{refund.reason}</span>
                                            <small>Referensi: {refund.refund_key}</small>
                                            {refund.error_message && <small className="booking-refund-error">{refund.error_message}</small>}
                                        </div>
                                        <div className={`booking-refund-state is-${refund.status}`}>
                                            {refund.status === 'confirmed' ? 'Dikonfirmasi' : refund.status === 'failed' ? 'Gagal' : 'Menunggu konfirmasi'}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {canRefund && (
                        <section className="admin-panel booking-refund-action" id="refund">
                            <div className="panel-head">
                                <div>
                                    <h2>Refund booking</h2>
                                    <p>Atur nominal refund sesuai sisa transaksi dan ketentuan metode pembayaran Midtrans.</p>
                                </div>
                                <RotateCcw aria-hidden="true" />
                            </div>
                            <div className="booking-refund-warning">
                                <strong>Perhatian</strong>
                                <p>Nominal maksimal yang dapat dikembalikan: <strong>{formatCurrency(refundRemaining)}</strong>. Jadwal baru dilepas jika seluruh pembayaran telah dikembalikan dan dikonfirmasi Midtrans. Jika respons gateway tidak pasti, permintaan tidak akan otomatis dikirim ulang.</p>
                            </div>
                            <form onSubmit={submitRefund}>
                                <label>
                                    Nominal refund (Rp)
                                    <input
                                        type="number"
                                        name="amount"
                                        min={1}
                                        max={refundRemaining}
                                        step={1}
                                        value={refundForm.data.amount}
                                        onChange={(event) => refundForm.setData('amount', event.target.value)}
                                        readOnly={!canPartialRefund}
                                        required
                                    />
                                </label>
                                {refundForm.errors.amount && <small className="field-error">{refundForm.errors.amount}</small>}
                                {!canPartialRefund && <small className="booking-refund-note">Metode pembayaran ini tidak mendukung refund sebagian melalui Midtrans. Nominal diatur ke seluruh sisa transaksi.</small>}
                                <label>
                                    Alasan refund
                                    <textarea
                                        name="reason"
                                        value={refundForm.data.reason}
                                        onChange={(event) => refundForm.setData('reason', event.target.value)}
                                        maxLength={255}
                                        rows={3}
                                        required
                                        placeholder="Tuliskan alasan untuk jejak audit."
                                    />
                                </label>
                                {refundForm.errors.reason && <small className="field-error">{refundForm.errors.reason}</small>}
                                {refundErrors.refund && <p className="booking-refund-error">{refundErrors.refund}</p>}
                                <button className="button danger" type="submit" disabled={refundForm.processing}>
                                    <RotateCcw size={16} aria-hidden="true" />
                                    {refundForm.processing ? 'Mengirim permintaan…' : `Ajukan refund · ${formatCurrency(Number(refundForm.data.amount || 0))}`}
                                </button>
                            </form>
                        </section>
                    )}
                </div>
            </main>
            <ConfirmDialog
                open={confirmRefund}
                onOpenChange={setConfirmRefund}
                title="Ajukan refund?"
                description={`Nominal ${formatCurrency(Number(refundForm.data.amount || 0))} akan diajukan ke Midtrans. Jika diterima gateway, permintaan tidak dapat dibatalkan dari aplikasi.`}
                confirmLabel="Ya, ajukan refund"
                onConfirm={confirmRefundRequest}
                processing={refundForm.processing}
            />
            <StatusDialog
                open={Boolean(statusDialog)}
                onOpenChange={(open) => !open && setStatusDialog(null)}
                type={statusDialog?.type || 'success'}
                message={statusDialog?.message || ''}
            />
        </div>
    );
}
