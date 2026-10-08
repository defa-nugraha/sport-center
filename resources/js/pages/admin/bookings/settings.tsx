import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Check, Clock3, Settings2 } from 'lucide-react';

function formatRupiah(value: number | string) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits ? `Rp ${Number(digits).toLocaleString('id-ID')}` : '';
}

function FacilityBookingSettings({ facility }: { facility: any }) {
    const form = useForm({
        booking_enabled: Boolean(facility.booking_enabled),
        booking_mode: facility.booking_mode || 'hourly',
        booking_price_per_hour: formatRupiah(facility.booking_price_per_hour),
        booking_price_per_day: formatRupiah(facility.booking_price_per_day),
        booking_min_hours: String(facility.booking_min_hours ?? 1),
    });

    const updatePrice = (field: 'booking_price_per_hour' | 'booking_price_per_day', value: string) => {
        const digits = value.replace(/\D/g, '');
        form.setData(field, digits ? formatRupiah(digits) : '');
    };

    return (
        <form
            className="booking-settings-card"
            onSubmit={(event) => {
                event.preventDefault();
                form.put(`/admin/bookings/facilities/${facility.encrypted_id}`, {
                    preserveScroll: true,
                });
            }}
        >
            <div className="booking-settings-card-head">
                <div className="booking-facility-icon">
                    <Settings2 aria-hidden="true" />
                </div>
                <div>
                    <span className="booking-settings-kicker">Venue</span>
                    <h2>{facility.name}</h2>
                    <p>Atur mode, harga, durasi minimum, dan status ketersediaan venue.</p>
                </div>
                <span className={form.data.booking_enabled ? 'booking-enabled-badge' : 'booking-disabled-badge'}>
                    {form.data.booking_enabled ? 'Booking aktif' : 'Booking nonaktif'}
                </span>
            </div>

            <div className="booking-settings-fields">
                <label>
                    Mode booking
                    <select
                        value={form.data.booking_mode}
                        onChange={(event) => form.setData('booking_mode', event.target.value as 'hourly' | 'daily')}
                    >
                        <option value="hourly">Per jam</option>
                        <option value="daily">Per hari</option>
                    </select>
                    <small>Pilih apakah pelanggan memesan berdasarkan jam atau rentang hari.</small>
                    {form.errors.booking_mode && <span className="booking-field-error">{form.errors.booking_mode}</span>}
                </label>

                <label>
                    Harga per jam
                    <div className="booking-rupiah-input">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.data.booking_price_per_hour}
                            onChange={(event) => updatePrice('booking_price_per_hour', event.target.value)}
                            placeholder="Rp 0"
                            aria-describedby={`price-hour-help-${facility.encrypted_id}`}
                        />
                    </div>
                    <small id={`price-hour-help-${facility.encrypted_id}`}>Dipakai saat mode per jam.</small>
                    {form.errors.booking_price_per_hour && <span className="booking-field-error">{form.errors.booking_price_per_hour}</span>}
                </label>

                <label>
                    Harga per hari
                    <div className="booking-rupiah-input">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={form.data.booking_price_per_day}
                            onChange={(event) => updatePrice('booking_price_per_day', event.target.value)}
                            placeholder="Rp 0"
                            aria-describedby={`price-day-help-${facility.encrypted_id}`}
                        />
                    </div>
                    <small id={`price-day-help-${facility.encrypted_id}`}>Dipakai untuk setiap hari dalam rentang booking.</small>
                    {form.errors.booking_price_per_day && <span className="booking-field-error">{form.errors.booking_price_per_day}</span>}
                </label>

                {form.data.booking_mode === 'hourly' && (
                    <label>
                        Minimal durasi booking
                        <div className="booking-unit-input">
                            <input
                                type="number"
                                min="1"
                                max="12"
                                step="1"
                                value={form.data.booking_min_hours}
                                onChange={(event) => form.setData('booking_min_hours', event.target.value)}
                            />
                            <span>jam</span>
                        </div>
                        <small>Minimal waktu yang dapat dipesan pelanggan.</small>
                        {form.errors.booking_min_hours && <span className="booking-field-error">{form.errors.booking_min_hours}</span>}
                    </label>
                )}

                <label className="booking-enabled-control">
                    <span className="booking-toggle-copy">
                        <strong>Terima booking online</strong>
                        <small>Aktifkan jika venue dapat dipesan melalui website.</small>
                    </span>
                    <input
                        type="checkbox"
                        checked={form.data.booking_enabled}
                        onChange={(event) => form.setData('booking_enabled', event.target.checked)}
                    />
                </label>
            </div>

            <div className="booking-settings-card-footer">
                <span>Perubahan akan langsung digunakan pada halaman booking pelanggan.</span>
                <button type="submit" className="button small" disabled={form.processing}>
                    <Check aria-hidden="true" />
                    {form.processing ? 'Menyimpan...' : 'Simpan perubahan'}
                </button>
            </div>
        </form>
    );
}

export default function Settings({ facilities }: { facilities: any[] }) {
    return (
        <div className="admin-shell">
            <Head title="Pengaturan venue" />
            <AdminSidebar active="bookings" />
            <main className="admin-main">
                <AdminTopbar
                    eyebrow="Kelola booking"
                    title="Pengaturan venue"
                    description="Atur mode booking, harga per jam/per hari, durasi minimum, dan ketersediaan setiap venue."
                />

                <div className="booking-admin-page-actions">
                    <Link href="/admin/bookings" className="text-button">Daftar booking</Link>
                </div>

                <section className="admin-panel booking-settings-page-panel">
                    <div className="panel-head">
                        <div>
                            <span className="booking-settings-kicker">Konfigurasi</span>
                            <h2>Venue yang dapat dipesan</h2>
                            <p>Pilih mode per jam untuk jadwal berbasis waktu atau mode per hari untuk rentang tanggal.</p>
                        </div>
                        <Clock3 aria-hidden="true" />
                    </div>

                    {facilities.length > 0 ? (
                        <div className="booking-settings-list">
                            {facilities.map((facility) => (
                                <FacilityBookingSettings key={facility.encrypted_id} facility={facility} />
                            ))}
                        </div>
                    ) : (
                        <div className="booking-empty-state">
                            <Settings2 aria-hidden="true" />
                            <strong>Belum ada fasilitas</strong>
                            <p>Tambahkan fasilitas terlebih dahulu agar dapat digunakan untuk booking.</p>
                            <Link className="text-link" href="/admin/content?tab=facilities">Kelola fasilitas</Link>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
