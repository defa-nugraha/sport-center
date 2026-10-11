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
        <div className="admin-shell">
            <Head title="Pengaturan WhatsApp admin" />
            <AdminSidebar active="bookings" />
            <main className="admin-main">
                <AdminTopbar
                    title="Notifikasi WhatsApp"
                    description="Atur nomor admin yang menerima pemberitahuan ketika pembayaran booking berhasil."
                />

                {notice && (
                    <div role="status" className="admin-panel flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <p>{notice}</p>
                    </div>
                )}

                <section className="admin-panel mx-auto w-full max-w-3xl space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <MessageCircle className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold">Penerima notifikasi pembayaran</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Admin akan menerima pesan saat gateway pembayaran memverifikasi transaksi berhasil.
                                Notifikasi tidak dikirim hanya karena booking dibuat atau pelanggan membuka halaman pembayaran.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border p-4">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div>
                                <p className="font-medium">Status koneksi gateway</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {gateway.configured
                                        ? 'Konfigurasi URL, API key, dan sender gateway sudah tersedia di server.'
                                        : 'Gateway belum lengkap. Atur WA_GATEWAY_URL, WA_GATEWAY_API_KEY, dan WA_GATEWAY_SENDER pada environment server sebelum mengaktifkan pengiriman.'}
                                </p>
                                <p className="mt-2 break-all text-xs text-muted-foreground">{gateway.url}</p>
                            </div>
                        </div>
                    </div>

                    <form
                        className="space-y-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put('/admin/bookings/whatsapp-settings', {
                                preserveScroll: true,
                                onSuccess: () => setNotice('Pengaturan notifikasi WhatsApp admin berhasil disimpan.'),
                            });
                        }}
                    >
                        <label className="block space-y-2">
                            <span className="text-sm font-medium">Nomor WhatsApp admin</span>
                            <input
                                type="tel"
                                autoComplete="tel"
                                value={form.data.phone}
                                onChange={(event) => form.setData('phone', event.target.value)}
                                placeholder="6281234567890"
                                className="w-full rounded-lg border bg-background px-3 py-2.5"
                                aria-invalid={Boolean(form.errors.phone)}
                                required
                            />
                            <span className="block text-xs text-muted-foreground">
                                Gunakan kode negara tanpa tanda + atau awalan 0, misalnya 6281234567890.
                            </span>
                            {form.errors.phone && <span className="block text-sm text-destructive">{form.errors.phone}</span>}
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                            <input
                                type="checkbox"
                                checked={form.data.enabled}
                                onChange={(event) => form.setData('enabled', event.target.checked)}
                                className="mt-1 h-4 w-4"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2 font-medium">
                                    <BellRing className="h-4 w-4" aria-hidden="true" />
                                    Aktifkan notifikasi pembayaran
                                </span>
                                <span className="mt-1 block text-sm text-muted-foreground">
                                    Kirim pesan WhatsApp kepada nomor di atas setiap ada pembayaran booking yang berhasil diverifikasi.
                                </span>
                            </span>
                        </label>

                        {form.errors.enabled && <p className="text-sm text-destructive">{form.errors.enabled}</p>}

                        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground">
                                API key gateway tidak ditampilkan dan tetap dikelola melalui environment server.
                            </p>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="button small"
                            >
                                {form.processing ? 'Menyimpan...' : 'Simpan pengaturan'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
