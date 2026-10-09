import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { asset } from '@/components/public-site';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react';

const blank = { name: '', description: '', photo: null as File | null };
export default function TeamMembers({ members }: any) {
    const { flash } = usePage().props as any;
    const form = useForm(blank);
    const [editing, setEditing] = useState<any>(null);
    const [modal, setModal] = useState(false);
    const [notice, setNotice] = useState('');
    useEffect(() => { if (flash?.success) setNotice(flash.success); }, [flash?.success]);
    const openCreate = () => { setEditing(null); form.reset(); form.setData(blank); setModal(true); };
    const openEdit = (member: any) => {
        setEditing(member);
        form.setData({ name: member.name, description: member.description || '', photo: null });
        setModal(true);
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { forceFormData: true, preserveScroll: true, onSuccess: () => { setModal(false); setEditing(null); form.reset(); } };
        if (editing) {
            form.transform(data => ({ ...data, _method: 'put' }));
            form.post(`/admin/team-members/${editing.id}`, options);
        } else form.post('/admin/team-members', options);
    };
    const remove = (member: any) => {
        if (window.confirm(`Hapus anggota tim "${member.name}"?`)) router.delete(`/admin/team-members/${member.id}`, { preserveScroll: true });
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
                    {notice && <div className="flash-success">{notice}</div>}
                    <section className="admin-panel team-admin-panel">
                        {members.length ? <div className="admin-list team-admin-list">{members.map((member: any) => (
                            <div className="admin-row admin-row-media team-admin-row" key={member.id}>
                                <img className="team-admin-photo" src={asset(member.photo)} alt={member.name} />
                                <div className="team-admin-member-copy"><strong>{member.name}</strong><small>{member.description || 'Tanpa deskripsi'}</small></div>
                                <span className="admin-row-actions team-admin-actions">
                                    <button className="icon-button" type="button" onClick={() => openEdit(member)} aria-label={`Ubah ${member.name}`}><Pencil /></button>
                                    <button className="icon-button danger" type="button" onClick={() => remove(member)} aria-label={`Hapus ${member.name}`}><Trash2 /></button>
                                </span>
                            </div>
                        ))}</div> : <div className="user-empty"><Users/><strong>Belum ada anggota tim</strong><p>Tambahkan anggota agar section tim muncul di beranda.</p></div>}
                    </section>
                </div>
                </main>
            </div>
            {modal && <div className="cms-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModal(false); }}>
                <section className="cms-modal" role="dialog" aria-modal="true" aria-labelledby="team-member-modal-title">
                    <header><h2 id="team-member-modal-title">{editing ? 'Ubah anggota tim' : 'Tambah anggota tim'}</h2><button className="icon-button" type="button" onClick={() => setModal(false)} aria-label="Tutup"><X/></button></header>
                    <form onSubmit={submit} encType="multipart/form-data">
                        <label className="field-label">Nama anggota<input value={form.data.name} onChange={e => form.setData('name', e.target.value)} required maxLength={120} /></label>
                        <label className="field-label">Deskripsi singkat<textarea value={form.data.description} onChange={e => form.setData('description', e.target.value)} rows={3} maxLength={180} placeholder="Contoh: Pengelola fasilitas olahraga" /></label>
                        <label className="field-label">Foto anggota<input type="file" accept="image/*" onChange={e => form.setData('photo', e.target.files?.[0] || null)} required={!editing} />{editing && <small>Kosongkan jika tidak ingin mengganti foto. Maksimal 5 MB.</small>}</label>
                        {Object.values(form.errors).length > 0 && <p className="form-error">{Object.values(form.errors)[0] as string}</p>}
                        <footer className="cms-modal-actions"><button type="button" className="button button-secondary" onClick={() => setModal(false)}>Batal</button><button className="button" disabled={form.processing}>{form.processing ? 'Menyimpan...' : 'Simpan'}</button></footer>
                    </form>
                </section>
            </div>}
        </>
    );
}
