import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { StatusDialog } from '@/components/admin-cms';
import { Check, Clock3, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';

function formatRupiah(value: number | string) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits ? `Rp ${Number(digits).toLocaleString('id-ID')}` : '';
}

function FacilityBookingSettings({ facility, onStatus }: { facility: any; onStatus: (status: { type: 'success' | 'error'; message: string }) => void }) {
    const form = useForm({
        booking_enabled: Boolean(facility.booking_enabled),
        booking_mode: facility.booking_mode || 'hourly',
        booking_price_per_hour: formatRupiah(facility.booking_price_per_hour),
        booking_price_per_day: formatRupiah(facility.booking_price_per_day),
        booking_min_hours: String(facility.booking_min_hours ?? 1),
        booking_operating_start: String(facility.booking_operating_start ?? '07:00').slice(0, 5),
        booking_operating_end: String(facility.booking_operating_end ?? '22:00').slice(0, 5),
        booking_buffer_minutes: String(facility.booking_buffer_minutes ?? 45),
    });
    const daily = form.data.booking_mode === 'daily';
    const hourly = form.data.booking_mode === 'hourly';
    const both = form.data.booking_mode === 'both';

    const updatePrice = (field: 'booking_price_per_hour' | 'booking_price_per_day', value: string) => {
        const digits = value.replace(/\D/g, '');
        form.setData(field, digits ? formatRupiah(digits) : '');
    };

    return (
        <form className="booking-settings-card" onSubmit={(event) => {
            event.preventDefault();
            form.put(`/admin/bookings/facilities/${facility.encrypted_id}`, {
                preserveScroll: true,
                onSuccess: () => onStatus({ type: 'success', message: `Pengaturan booking ${facility.name} berhasil disimpan.` }),
                onError: (errors) => onStatus({ type: 'error', message: Object.values(errors)[0] || `Pengaturan booking ${facility.name} gagal disimpan.` }),
            });
        }}>
            <div className="booking-settings-card-head">
                <div className="booking-facility-icon"><Settings2 aria-hidden="true" /></div>
                <div>
                    <span className="booking-settings-kicker">Venue</span>
                    <h2>{facility.name}</h2>
                    <p>Atur mode, harga, durasi, jam operasional, jeda sterilisasi, dan status ketersediaan venue.</p>
                </div>
                <span className={form.data.booking_enabled ? 'booking-enabled-badge' : 'booking-disabled-badge'}>
                    {form.data.booking_enabled ? 'Booking aktif' : 'Booking nonaktif'}
                </span>
            </div>

            <div className="booking-settings-fields">
                <label>
                    Mode booking
                    <select value={form.data.booking_mode} onChange={(event) => form.setData('booking_mode', event.target.value)}>
                        <option value="hourly">Per jam</option>
                        <option value="daily">Per hari</option>
                        <option value="both">Per jam &amp; per hari</option>
                    </select>
                    <small>{daily ? 'Pelanggan memilih rentang tanggal.' : hourly ? 'Pelanggan memilih tanggal, jam mulai, dan durasi.' : 'Pelanggan wajib memilih booking per jam atau per hari.'}</small>
                    {form.errors.booking_mode && <span className="booking-field-error">{form.errors.booking_mode}</span>}
                </label>

                {(hourly || both) && (
                    <>
                        <label>
                            Harga per jam
                            <input type="text" inputMode="numeric" value={form.data.booking_price_per_hour} onChange={(event) => updatePrice('booking_price_per_hour', event.target.value)} placeholder="Rp 0" />
                            <small>Harga yang dibayar untuk setiap jam booking.</small>
                            {form.errors.booking_price_per_hour && <span className="booking-field-error">{form.errors.booking_price_per_hour}</span>}
                        </label>
                        <label>
                            Minimal durasi booking
                            <div className="booking-unit-input"><input type="number" min="1" max="12" step="1" value={form.data.booking_min_hours} onChange={(event) => form.setData('booking_min_hours', event.target.value)} /><span>jam</span></div>
                            <small>Minimal waktu yang dapat dipesan pelanggan.</small>
                            {form.errors.booking_min_hours && <span className="booking-field-error">{form.errors.booking_min_hours}</span>}
                        </label>
                        <label>
                            Mulai operasional
                            <input type="time" value={form.data.booking_operating_start} onChange={(event) => form.setData('booking_operating_start', event.target.value)} />
                            <small>Waktu paling awal pelanggan dapat memilih sesi.</small>
                            {form.errors.booking_operating_start && <span className="booking-field-error">{form.errors.booking_operating_start}</span>}
                        </label>
                        <label>
                            Selesai operasional
                            <input type="time" value={form.data.booking_operating_end} onChange={(event) => form.setData('booking_operating_end', event.target.value)} />
                            <small>Booking harus selesai sebelum jam ini.</small>
                            {form.errors.booking_operating_end && <span className="booking-field-error">{form.errors.booking_operating_end}</span>}
                        </label>
                        <label>
                            Jeda sterilisasi antar sesi
                            <div className="booking-unit-input"><input type="number" min="0" max="180" step="5" value={form.data.booking_buffer_minutes} onChange={(event) => form.setData('booking_buffer_minutes', event.target.value)} /><span>menit</span></div>
                            <small>Waktu setelah satu sesi selesai sebelum sesi berikutnya dapat dimulai.</small>
                            {form.errors.booking_buffer_minutes && <span className="booking-field-error">{form.errors.booking_buffer_minutes}</span>}
                        </label>
                    </>
                )}
                {(daily || both) && (
                    <label>
                        Harga per hari
                        <input type="text" inputMode="numeric" value={form.data.booking_price_per_day} onChange={(event) => updatePrice('booking_price_per_day', event.target.value)} placeholder="Rp 0" />
                        <small>Harga untuk setiap hari dalam rentang booking.</small>
                        {form.errors.booking_price_per_day && <span className="booking-field-error">{form.errors.booking_price_per_day}</span>}
                    </label>
                )}

                <label className="booking-enabled-control">
                    <span className="booking-toggle-copy"><strong>Terima booking online</strong><small>Aktifkan jika venue dapat dipesan melalui website.</small></span>
                    <input type="checkbox" checked={form.data.booking_enabled} onChange={(event) => form.setData('booking_enabled', event.target.checked)} />
                </label>
            </div>

            <div className="booking-settings-card-footer">
                <span>Mode dan harga akan langsung digunakan pada halaman booking pelanggan.</span>
                <button type="submit" className="button small" disabled={form.processing}><Check aria-hidden="true" />{form.processing ? 'Menyimpan...' : 'Simpan perubahan'}</button>
            </div>
        </form>
    );
}

export default function Settings({ facilities }: { facilities: any[] }) {
    const { flash } = usePage().props as any;
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);
    return (
        <div className="admin-shell">
            <Head title="Pengaturan venue" />
            <AdminSidebar active="bookings" />
            <main className="admin-main">
                <AdminTopbar eyebrow="Kelola booking" title="Pengaturan venue" description="Atur mode, harga, durasi, jam operasional, jeda sterilisasi, dan ketersediaan booking setiap venue." />
                <div className="booking-admin-page-actions"><Link href="/admin/bookings" className="text-button">Daftar booking</Link></div>
                <section className="admin-panel booking-settings-page-panel">
                    <div className="panel-head"><div><span className="booking-settings-kicker">Konfigurasi</span><h2>Venue yang dapat dipesan</h2><p>Setiap venue memiliki pengaturan sendiri agar aturan booking tetap mudah dikelola.</p></div><Clock3 aria-hidden="true" /></div>
                    {facilities.length > 0 ? <div className="booking-settings-list">{facilities.map((facility) => <FacilityBookingSettings key={facility.encrypted_id} facility={facility} onStatus={setStatus} />)}</div> : <div className="booking-empty-state"><Settings2 aria-hidden="true" /><strong>Belum ada fasilitas</strong><p>Tambahkan fasilitas terlebih dahulu agar dapat digunakan untuk booking.</p><Link className="text-link" href="/admin/content?tab=facilities">Kelola fasilitas</Link></div>}
                </section>
            </main>
            <StatusDialog open={Boolean(status)} onOpenChange={(open) => !open && setStatus(null)} type={status?.type || 'success'} message={status?.message || ''} />
        </div>
    );
}
