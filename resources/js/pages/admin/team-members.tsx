import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { CmsModal, ConfirmDialog, StatusDialog } from '@/components/admin-cms';
import { asset } from '@/components/public-site';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';

const blank = { name: '', description: '', photo: null as File | null };
export default function TeamMembers({ members }: any) {
    const { flash } = usePage().props as any;
    const form = useForm(blank);
    const [editing, setEditing] = useState<any>(null);
    const [modal, setModal] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
    const pageCount = Math.ceil(members.length / pageSize);
    const visibleMembers = members.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);
    const openCreate = () => { setEditing(null); form.reset(); form.setData(blank); setModal(true); };
    const openEdit = (member: any) => {
        setEditing(member);
        form.setData({ name: member.name, description: member.description || '', photo: null });
        setModal(true);
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setModal(false);
                setEditing(null);
                form.reset();
                setStatus({ type: 'success', message: editing ? 'Data anggota tim berhasil diperbarui.' : 'Anggota tim berhasil ditambahkan.' });
            },
            onError: (errors: Record<string, string>) => setStatus({
                type: 'error',
                message: Object.values(errors)[0] || 'Anggota tim gagal disimpan. Silakan coba lagi.',
            }),
        };
        form.transform(data => editing ? { ...data, _method: 'put' } : data);
        if (editing) form.post(`/admin/team-members/${editing.id}`, options);
        else form.post('/admin/team-members', options);
    };
    const remove = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(`/admin/team-members/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteTarget(null);
                setStatus({ type: 'success', message: 'Anggota tim berhasil dihapus.' });
            },
            onError: (errors: Record<string, string>) => setStatus({
                type: 'error',
                message: Object.values(errors)[0] || 'Anggota tim gagal dihapus. Silakan coba lagi.',
            }),
            onFinish: () => setDeleting(false),
        });
    };
    return (
        <>
            <Head title="Kelola Tim" />
            <div className="admin-shell">
                <AdminSidebar active="pages" pageSection="team" />
                <main className="admin-main team-admin-page">
                <AdminTopbar title="Tim" />
                <div className="admin-content">
                    <div className="admin-page-heading team-admin-heading">
                        <div><span className="eyebrow">KONTEN BERANDA</span><h1>Kelola Tim</h1><p>Atur foto, nama, dan deskripsi singkat anggota tim yang tampil di beranda publik.</p></div>
                        <button className="button" type="button" onClick={openCreate}><Plus size={18}/> Tambah anggota</button>
                    </div>
                    <section className="admin-panel team-admin-panel">
                        {members.length ? <><div className="admin-list team-admin-list">{visibleMembers.map((member: any) => (
                            <div className="admin-row admin-row-media team-admin-row" key={member.id}>
                                <img className="team-admin-photo" src={asset(member.photo)} alt={member.name} />
                                <div className="team-admin-member-copy"><strong>{member.name}</strong><small>{member.description || 'Tanpa deskripsi'}</small></div>
                                <span className="admin-row-actions team-admin-actions">
                                    <button className="icon-button" type="button" onClick={() => openEdit(member)} aria-label={`Ubah ${member.name}`}><Pencil /></button>
                                    <button className="icon-button danger" type="button" onClick={() => setDeleteTarget(member)} aria-label={`Hapus ${member.name}`}><Trash2 /></button>
                                </span>
                            </div>
                        ))}</div>{pageCount > 1 && <nav className="pagination" aria-label="Pagination anggota tim" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 16 }}><small>Menampilkan {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, members.length)} dari {members.length} anggota</small><div style={{ display: 'flex', gap: 6 }}><button type="button" className="button small" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Sebelumnya</button><span style={{ alignSelf: 'center' }}>Halaman {currentPage} dari {pageCount}</span><button type="button" className="button small" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => p + 1)}>Berikutnya</button></div></nav>}</> : <div className="user-empty"><Users/><strong>Belum ada anggota tim</strong><p>Tambahkan anggota agar section tim muncul di beranda.</p></div>}
                    </section>
                </div>
                </main>
            </div>
            <CmsModal open={modal} onOpenChange={setModal} title={editing ? 'Ubah anggota tim' : 'Tambah anggota tim'} description={editing ? 'Perbarui informasi anggota tim. Foto bersifat opsional jika tidak ingin diganti.' : 'Isi informasi anggota tim yang akan ditampilkan di beranda.'} size="md">
                <form className="cms-form modal-form" onSubmit={submit} encType="multipart/form-data">
                    <label>Nama anggota *<input value={form.data.name} onChange={e => form.setData('name', e.target.value)} required maxLength={120} /></label>
                    <label>Deskripsi singkat<textarea value={form.data.description} onChange={e => form.setData('description', e.target.value)} rows={3} maxLength={180} placeholder="Contoh: Pengelola fasilitas olahraga" /></label>
                    <label>Foto anggota {!editing && '*'}<input type="file" accept="image/*" onChange={e => form.setData('photo', e.target.files?.[0] || null)} required={!editing} />{editing && <small>Kosongkan jika tidak ingin mengganti foto. Maksimal 5 MB.</small>}</label>
                    {Object.values(form.errors).length > 0 && <p className="form-error">{Object.values(form.errors)[0] as string}</p>}
                    <footer className="cms-modal-actions" style={{ justifyContent: 'flex-end' }}><button className="button" disabled={form.processing}>{form.processing ? 'Menyimpan...' : 'Simpan'}</button></footer>
                </form>
            </CmsModal>
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
                itemName={deleteTarget?.name}
                onConfirm={remove}
                processing={deleting}
            />
            <StatusDialog
                open={Boolean(status)}
                onOpenChange={(open) => !open && setStatus(null)}
                type={status?.type || 'success'}
                message={status?.message || ''}
            />
        </>
    );
}
