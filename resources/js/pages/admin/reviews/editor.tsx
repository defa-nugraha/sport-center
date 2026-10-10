import { CmsSelect, StatusDialog } from '@/components/admin-cms';
import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ChevronLeft, Save, Star } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { AdminReviewEditorSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function ReviewEditor({ review }: any) {
    const loading = usePageLoading();
    const { flash } = usePage().props as any;
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const form = useForm({
        name: review?.name || '',
        organization: review?.organization || '',
        rating: Number(review?.rating || 5),
        review: review?.review || '',
        status: review?.status || 'pending',
    });
    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setStatus({ type: 'success', message: review ? 'Ulasan berhasil diperbarui.' : 'Ulasan berhasil ditambahkan.' }),
            onError: (errors: Record<string, string>) => setStatus({ type: 'error' as const, message: Object.values(errors)[0] || 'Periksa kembali data ulasan.' }),
        };
        if (review) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/reviews/${review.encrypted_id}`, options);
        } else form.post('/admin/reviews', options);
    };

    if (loading) return <AdminReviewEditorSkeleton />;

    return (
        <div className="admin-shell">
            <Head title={review ? 'Edit ulasan' : 'Tambah ulasan'} />
            <AdminSidebar active="content" contentSection="reviews" />
            <main className="admin-main review-editor-page">
                <AdminTopbar title={review ? 'Edit Ulasan' : 'Tambah Ulasan'} description="Pastikan identitas, rating, dan isi ulasan mudah dipahami pengunjung." action={<button className="button" form="review-editor-form" disabled={form.processing}><Save aria-hidden="true" /> {form.processing ? 'Menyimpan...' : 'Simpan ulasan'}</button>} />
                <Link className="text-link review-editor-back" href="/admin/reviews"><ChevronLeft aria-hidden="true" /> Kembali ke daftar ulasan</Link>
                <form id="review-editor-form" className="admin-panel cms-form review-editor-form" onSubmit={submit}>
                    <div className="two-col">
                        <label>Nama pengulas *<input required maxLength={120} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></label>
                        <label>Komunitas / organisasi<input maxLength={120} value={form.data.organization} onChange={(e) => form.setData('organization', e.target.value)} /></label>
                    </div>
                    <fieldset className="review-rating-field"><legend>Rating *</legend><div>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" className={rating <= form.data.rating ? 'active' : ''} onClick={() => form.setData('rating', rating)} aria-label={`${rating} bintang`}><Star aria-hidden="true" /></button>)}</div><small>{form.data.rating} dari 5 bintang</small></fieldset>
                    <label>Isi ulasan *<textarea required maxLength={1000} rows={7} value={form.data.review} onChange={(e) => form.setData('review', e.target.value)} /><small>{form.data.review.length}/1000 karakter</small></label>
                    <label>Status moderasi<CmsSelect value={form.data.status} onValueChange={(value) => form.setData('status', value)} options={[
                        { value: 'pending', label: 'Menunggu pemeriksaan' },
                        { value: 'approved', label: 'Disetujui dan tampil di publik' },
                        { value: 'rejected', label: 'Ditolak' },
                    ]} /></label>
                    <div className="cms-submit"><button className="button" disabled={form.processing}><Save aria-hidden="true" /> {form.processing ? 'Menyimpan...' : 'Simpan ulasan'}</button></div>
                </form>
            </main>
            <StatusDialog open={Boolean(status)} onOpenChange={(open) => !open && setStatus(null)} type={status?.type || 'success'} message={status?.message || ''} />
        </div>
    );
}
