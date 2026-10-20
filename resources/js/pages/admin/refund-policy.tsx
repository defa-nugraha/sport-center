import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Info, Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

export default function AdminRefundPolicy({ refundPolicy }: { refundPolicy: string }) {
    const { flash } = usePage().props as any;
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const form = useForm({ refund_policy_html: refundPolicy });

    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put('/admin/refund-policy', {
            preserveScroll: true,
            onSuccess: () => setStatus({ type: 'success', message: 'Ketentuan refund berhasil disimpan.' }),
            onError: (errors) => setStatus({
                type: 'error',
                message: Object.values(errors)[0] || 'Ketentuan refund gagal disimpan. Periksa kembali isinya.',
            }),
        });
    };

    return (
        <div className="admin-shell">
            <Head title="Kelola Refund" />
            <AdminSidebar active="refund-policy" />
            <main className="admin-main">
                <AdminTopbar title="Kelola Refund" description="Atur informasi ketentuan pengembalian dana yang dibaca pengguna sebelum melakukan pemesanan." />
                <section className="admin-panel refund-policy-editor-panel">
                    <div className="panel-head">
                        <div>
                            <h2>Ketentuan pengembalian dana</h2>
                            <p>Konten ini hanya untuk informasi. Pengembalian dana transaksi tetap mengikuti proses operasional yang sudah tersedia.</p>
                        </div>
                    </div>
                    <div className="refund-policy-editor-note">
                        <Info aria-hidden="true" />
                        <span>Gunakan editor untuk mengatur judul, paragraf, daftar, tautan, dan penekanan teks. Pastikan isi aturan sudah disetujui pengelola sebelum dipublikasikan.</span>
                    </div>
                    <form className="cms-form refund-policy-editor" onSubmit={submit}>
                        <label>Isi ketentuan refund *</label>
                        <RichTextEditor
                            label="Editor ketentuan refund"
                            value={form.data.refund_policy_html}
                            onChange={(value) => form.setData('refund_policy_html', value)}
                        />
                        {form.errors.refund_policy_html && <p className="form-error">{form.errors.refund_policy_html}</p>}
                        {status && <p className={status.type === 'success' ? 'form-success' : 'form-error'} role="status">{status.message}</p>}
                        <div className="refund-policy-actions">
                            <button type="submit" className="button" disabled={form.processing}>
                                <Save aria-hidden="true" /> {form.processing ? 'Menyimpan...' : 'Simpan ketentuan refund'}
                            </button>
                            <a className="button secondary" href="/refund-policy" target="_blank" rel="noreferrer">Lihat halaman publik</a>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
