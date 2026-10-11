import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { BellRing, CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
    settings: {
        enabled: boolean;
        phone: string;
    };
    gateway: {
        url: string;
        configured: boolean;
    };
};

export default function WhatsAppSettings({ settings, gateway }: Props) {
    const { flash } = usePage().props as any;
    const [notice, setNotice] = useState<string | null>(null);
    const form = useForm({
        enabled: settings.enabled,
        phone: settings.phone,
    });

    useEffect(() => {
        if (flash?.success) setNotice(flash.success);
    }, [flash?.success]);

    return (
        <div className="admin-shell whatsapp-settings-shell">
            <Head title="Pengaturan WhatsApp admin" />
            <AdminSidebar active="bookings" />
            <main className="admin-main whatsapp-settings-page">
                <AdminTopbar
                    title="Notifikasi WhatsApp"
                    description="Atur penerima pesan otomatis ketika pembayaran booking berhasil diverifikasi."
                />

                <div className="whatsapp-settings-content">
                    {notice && (
                        <div role="status" className="whatsapp-settings-notice">
                            <CheckCircle2 aria-hidden="true" />
                            <p>{notice}</p>
                        </div>
                    )}

                    <section className="admin-panel whatsapp-settings-panel">
                        <header className="whatsapp-settings-heading">
                            <div className="whatsapp-settings-icon">
                                <MessageCircle aria-hidden="true" />
                            </div>
                            <div>
                                <h2>Penerima notifikasi pembayaran</h2>
                                <p>
                                    Admin akan menerima pesan setelah gateway pembayaran memverifikasi transaksi berhasil.
                                    Pesan tidak dikirim hanya karena booking dibuat atau halaman pembayaran dibuka.
                                </p>
                            </div>
                        </header>

                        <div className={`whatsapp-gateway-status ${gateway.configured ? 'is-ready' : 'is-missing'}`}>
                            <div className="whatsapp-gateway-icon">
                                <ShieldCheck aria-hidden="true" />
                            </div>
                            <div className="whatsapp-gateway-copy">
                                <strong>{gateway.configured ? 'Gateway siap digunakan' : 'Konfigurasi gateway belum lengkap'}</strong>
                                <p>
                                    {gateway.configured
                                        ? 'URL, API key, dan sender gateway telah tersedia di environment server.'
                                        : 'Lengkapi WA_GATEWAY_URL, WA_GATEWAY_API_KEY, dan WA_GATEWAY_SENDER di environment server sebelum mengaktifkan notifikasi.'}
                                </p>
                                {gateway.url && <code>{gateway.url}</code>}
                            </div>
                            <span className="whatsapp-gateway-indicator" aria-label={gateway.configured ? 'Siap' : 'Belum siap'} />
                        </div>

                        <form
                            className="whatsapp-settings-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.put('/admin/bookings/whatsapp-settings', {
                                    preserveScroll: true,
                                    onSuccess: () => setNotice('Pengaturan notifikasi WhatsApp admin berhasil disimpan.'),
                                });
                            }}
                        >
                            <div className="whatsapp-field">
                                <label htmlFor="whatsapp-admin-phone">Nomor WhatsApp admin</label>
                                <input
                                    id="whatsapp-admin-phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={form.data.phone}
                                    onChange={(event) => form.setData('phone', event.target.value)}
                                    placeholder="6281234567890"
                                    aria-invalid={Boolean(form.errors.phone)}
                                    aria-describedby="whatsapp-phone-help"
                                    required
                                />
                                <p id="whatsapp-phone-help">Gunakan kode negara, tanpa tanda + atau awalan 0. Contoh: 6281234567890.</p>
                                {form.errors.phone && <span className="whatsapp-field-error">{form.errors.phone}</span>}
                            </div>

                            <label className={`whatsapp-toggle-card ${form.data.enabled ? 'is-enabled' : ''} ${!gateway.configured ? 'is-disabled' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={form.data.enabled}
                                    onChange={(event) => form.setData('enabled', event.target.checked)}
                                    disabled={!gateway.configured}
                                />
                                <span className="whatsapp-toggle-copy">
                                    <strong><BellRing aria-hidden="true" /> Aktifkan notifikasi pembayaran</strong>
                                    <span>Kirim pesan WhatsApp ke nomor di atas setiap kali pembayaran booking berhasil diverifikasi.</span>
                                    {!gateway.configured && <small>Opsi ini tersedia setelah konfigurasi gateway dilengkapi.</small>}
                                </span>
                                <span className="whatsapp-toggle-state">{form.data.enabled ? 'Aktif' : 'Nonaktif'}</span>
                            </label>

                            {form.errors.enabled && <p className="whatsapp-field-error">{form.errors.enabled}</p>}

                            <footer className="whatsapp-settings-footer">
                                <p>API key tidak ditampilkan di halaman ini dan tetap dikelola melalui environment server.</p>
                                <button type="submit" disabled={form.processing} className="button whatsapp-save-button">
                                    {form.processing ? 'Menyimpan...' : 'Simpan pengaturan'}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}
