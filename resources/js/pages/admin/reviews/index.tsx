import { CmsSelect, ConfirmDialog, StatusDialog } from '@/components/admin-cms';
import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, Pencil, Plus, RotateCcw, Search, Star, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { AdminReviewListSkeleton, usePageLoading } from '@/components/page-skeletons';

const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
};

export default function ReviewIndex({ reviews, filters, counts }: any) {
    const loading = usePageLoading();
    const { flash } = usePage().props as any;
    const [query, setQuery] = useState(filters.q || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
    }, [flash?.success]);

    const filter = (event: FormEvent) => {
        event.preventDefault();
        router.get('/admin/reviews', { q: query, status: statusFilter }, { preserveState: true, replace: true });
    };
    const moderate = (review: any, nextStatus: string) => {
        router.patch(`/admin/reviews/${review.id}/status`, { status: nextStatus }, {
            preserveScroll: true,
            onError: (errors) => setStatus({ type: 'error', message: Object.values(errors)[0] || 'Status ulasan tidak dapat diperbarui.' }),
        });
    };
    const remove = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/reviews/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onError: (errors) => setStatus({ type: 'error', message: Object.values(errors)[0] || 'Ulasan tidak dapat dihapus.' }),
        });
    };

    if (loading) return <AdminReviewListSkeleton />;

    return (
        <div className="admin-shell">
            <Head title="Kelola ulasan" />
            <AdminSidebar active="content" contentSection="reviews" />
            <main className="admin-main review-admin-page">
                <AdminTopbar
                    title="Kelola Ulasan"
                    description="Periksa pengalaman pengunjung sebelum ditampilkan kepada publik."
                    action={<Link className="button" href="/admin/reviews/create"><Plus aria-hidden="true" /> Tambah ulasan</Link>}
                />
                <section className="review-summary-grid" aria-label="Ringkasan ulasan">
                    {Object.entries({ all: 'Semua', pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }).map(([key, label]) => (
                        <article key={key}><span>{label}</span><strong>{counts[key]}</strong></article>
                    ))}
                </section>
                <section className="admin-panel review-filter-panel">
                    <form onSubmit={filter}>
                        <label className="review-search-field"><span className="sr-only">Cari ulasan</span><Search aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, komunitas, atau isi ulasan" /></label>
                        <CmsSelect value={statusFilter} onValueChange={setStatusFilter} options={[
                            { value: 'all', label: 'Semua status' },
                            { value: 'pending', label: 'Menunggu pemeriksaan' },
                            { value: 'approved', label: 'Disetujui' },
                            { value: 'rejected', label: 'Ditolak' },
                        ]} />
                        <button className="button" type="submit">Terapkan</button>
                        {(filters.q || filters.status !== 'all') && <Link className="text-link" href="/admin/reviews">Atur ulang</Link>}
                    </form>
                </section>
                <section className="review-admin-list" aria-label="Daftar ulasan">
                    {reviews.data.length ? reviews.data.map((review: any) => (
                        <article className="admin-panel review-admin-card" key={review.id}>
                            <div className="review-admin-card-head">
                                <div><strong>{review.name}</strong><small>{review.organization || 'Pengunjung GGM'} · {new Date(review.created_at).toLocaleDateString('id-ID')}</small></div>
                                <span className={`review-status ${review.status}`}>{statusLabels[review.status]}</span>
                            </div>
                            <div className="review-stars" aria-label={`${review.rating} dari 5 bintang`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < review.rating ? 'filled' : ''} aria-hidden="true" />)}</div>
                            <p>{review.review}</p>
                            <div className="review-admin-actions">
                                {review.status !== 'approved' && <button className="button success" type="button" onClick={() => moderate(review, 'approved')}><Check aria-hidden="true" /> Setujui</button>}
                                {review.status !== 'rejected' && <button className="button secondary" type="button" onClick={() => moderate(review, 'rejected')}><X aria-hidden="true" /> Tolak</button>}
                                {review.status !== 'pending' && <button className="text-button" type="button" onClick={() => moderate(review, 'pending')}><RotateCcw aria-hidden="true" /> Kembalikan ke antrean</button>}
                                <Link className="icon-button" href={`/admin/reviews/${review.id}/edit`} aria-label={`Edit ulasan ${review.name}`}><Pencil aria-hidden="true" /></Link>
                                <button className="icon-button danger" type="button" onClick={() => setDeleteTarget(review)} aria-label={`Hapus ulasan ${review.name}`}><Trash2 aria-hidden="true" /></button>
                            </div>
                        </article>
                    )) : <div className="admin-panel admin-empty"><Star aria-hidden="true" /><strong>Ulasan tidak ditemukan</strong><span>Coba kata kunci atau status lain.</span></div>}
                </section>
                {reviews.links.length > 3 && <nav className="pagination" aria-label="Halaman ulasan">{reviews.links.map((link: any) => link.url ? <Link key={link.label} href={link.url} className={link.active ? 'active' : ''} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={link.label} aria-disabled="true" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>}
            </main>
            <StatusDialog open={Boolean(status)} onOpenChange={(open) => !open && setStatus(null)} type={status?.type || 'success'} message={status?.message || ''} />
            <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} itemName={deleteTarget ? `Ulasan dari ${deleteTarget.name}` : undefined} onConfirm={remove} />
        </div>
    );
}
