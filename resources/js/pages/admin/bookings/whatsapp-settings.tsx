import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { ProductTour, replayProductTour } from '@/components/product-tour';
import { Head, useForm, usePage } from '@inertiajs/react';
import { BellRing, CheckCircle2, CircleHelp, MessageCircle, ShieldCheck } from 'lucide-react';
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
    const testForm = useForm({ phone: settings.phone, test: '' });

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
                    action={<button type="button" className="button secondary small" onClick={() => replayProductTour('ggm-admin-whatsapp-tour-v1')}><CircleHelp aria-hidden="true" /> Panduan</button>}
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
                                    onChange={(event) => {
                                        form.setData('phone', event.target.value);
                                        testForm.setData('phone', event.target.value);
                                    }}
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
                            {testForm.errors.test && <p role="alert" className="whatsapp-field-error">{testForm.errors.test}</p>}
                            {testForm.errors.phone && <p role="alert" className="whatsapp-field-error">{testForm.errors.phone}</p>}

                            <footer className="whatsapp-settings-footer">
                                <p>API key tidak ditampilkan di halaman ini dan tetap dikelola melalui environment server.</p>
                                <div className="whatsapp-settings-actions">
                                    <button
                                        type="button"
                                        disabled={testForm.processing || !gateway.configured || !form.data.phone.trim()}
                                        className="button whatsapp-test-button"
                                        onClick={() => {
                                            testForm.setData('phone', form.data.phone);
                                            testForm.transform(({ phone }) => ({ phone }));
                                            testForm.post('/admin/bookings/whatsapp-settings/test-message', {
                                                preserveScroll: true,
                                                onSuccess: () => setNotice('Pesan uji berhasil dikirim. Periksa WhatsApp penerima.'),
                                            });
                                        }}
                                    >
                                        {testForm.processing ? 'Mengirim...' : 'Kirim pesan uji'}
                                    </button>
                                    <button type="submit" disabled={form.processing} className="button whatsapp-save-button">
                                        {form.processing ? 'Menyimpan...' : 'Simpan pengaturan'}
                                    </button>
                                </div>
                            </footer>
                        </form>
                    </section>
                </div>
            <ProductTour autoStart={false} storageKey="ggm-admin-whatsapp-tour-v1" steps={[
                { target: '.whatsapp-gateway-status', title: 'Status koneksi', description: 'Pastikan gateway WhatsApp telah dikonfigurasi sebelum mengaktifkan notifikasi.' },
                { target: '.whatsapp-settings-form', title: 'Pengaturan notifikasi', description: 'Masukkan nomor admin dengan kode negara dan aktifkan notifikasi sesuai kebutuhan.' },
                { target: '.whatsapp-test-button', title: 'Uji pesan', description: 'Kirim pesan uji untuk memeriksa konfigurasi sebelum menyimpan pengaturan.' },
                { target: '.whatsapp-save-button', title: 'Simpan perubahan', description: 'Simpan konfigurasi setelah nomor dan status notifikasi sudah benar.' },
            ]} />
            </main>
        </div>
    );
}
