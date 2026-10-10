import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, CircleSlash, LockKeyhole, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, Users, X } from 'lucide-react';
import '../../../../css/admin-users.css';

type ManagedUser = {
    id: number;
    encrypted_id: string;
    name: string;
    email: string;
    roles: string[];
    is_suspended: boolean;
    suspended_at?: string | null;
    suspension_reason?: string | null;
    created_at: string;
    bookings_count: number;
    can_manage: boolean;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

export default function AdminUsers({
    users,
    filters = { search: '', status: 'all' },
    summary = { total: 0, active: 0, suspended: 0 },
}: {
    users: { data: ManagedUser[]; total: number; links?: PaginationLink[]; from?: number; to?: number };
    filters?: { search?: string; status?: string };
    summary?: { total: number; active: number; suspended: number };
}) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [suspendTarget, setSuspendTarget] = useState<ManagedUser | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const suspension = useForm({ suspended: true, reason: '' });

    useEffect(() => {
        if (flash?.success) setStatusMessage(flash.success);
        if (flash?.error) setStatusMessage(flash.error);
    }, [flash?.success, flash?.error]);

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get('/admin/users', {
            search: search.trim() || undefined,
            status: status === 'all' ? undefined : status,
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openSuspend = (user: ManagedUser) => {
        setSuspendTarget(user);
        suspension.clearErrors();
        suspension.setData({ suspended: true, reason: '' });
    };

    const submitSuspend = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!suspendTarget) return;
        suspension.patch(`/admin/users/${suspendTarget.encrypted_id}/suspension`, {
            preserveScroll: true,
            onSuccess: () => {
                setSuspendTarget(null);
                setStatusMessage('Akun ditangguhkan dan sesi aktif dicabut.');
                suspension.reset();
            },
            onError: (errors) => setStatusMessage(Object.values(errors)[0] || 'Status akun gagal diperbarui.'),
        });
    };

    const activate = (user: ManagedUser) => {
        if (!window.confirm(`Aktifkan kembali akun ${user.name}?`)) return;
        router.patch(`/admin/users/${user.encrypted_id}/suspension`, { suspended: false, reason: '' }, {
            preserveScroll: true,
            onSuccess: () => setStatusMessage('Akun pengguna berhasil diaktifkan kembali.'),
            onError: (errors) => setStatusMessage(Object.values(errors)[0] || 'Akun gagal diaktifkan.'),
        });
    };

    const remove = (user: ManagedUser) => {
        if (!window.confirm(`Hapus akun ${user.name}? Tindakan ini tidak dapat dibatalkan.`)) return;
        router.delete(`/admin/users/${user.encrypted_id}`, {
            preserveScroll: true,
            onSuccess: () => setStatusMessage('Akun pengguna berhasil dihapus.'),
            onError: (errors) => setStatusMessage(Object.values(errors)[0] || 'Akun gagal dihapus.'),
        });
    };

    return (
        <div className="admin-shell">
            <Head title="Kelola Pengguna" />
            <AdminSidebar active="users" />
            <main className="admin-main admin-users-page">
                <AdminTopbar
                    title="Kelola Pengguna"
                    description="Kelola akun pelanggan, akses masuk, dan status penangguhan."
                />

                <div className="admin-page-heading admin-users-heading">
                    <div>
                        <span className="eyebrow">MANAJEMEN AKUN</span>
                        <h1>Pengguna</h1>
                        <p>Pengelolaan ini berlaku untuk akun pelanggan. Akun administrator dan staf berizin dilindungi.</p>
                    </div>
                    <Link href="/admin/users/create" className="button">
                        <Plus size={17} aria-hidden="true" /> Tambah pengguna
                    </Link>
                </div>

                {statusMessage && (
                    <div className="admin-users-flash" role="status">
                        <CheckCircle2 size={17} aria-hidden="true" />
                        <span>{statusMessage}</span>
                        <button type="button" onClick={() => setStatusMessage('')} aria-label="Tutup pesan"><X size={16} /></button>
                    </div>
                )}

                <section className="admin-users-summary" aria-label="Ringkasan akun">
                    <article className="admin-panel admin-user-stat">
                        <span className="admin-user-stat-icon"><Users aria-hidden="true" /></span>
                        <div><small>Total pengguna</small><strong>{summary.total.toLocaleString('id-ID')}</strong></div>
                    </article>
                    <article className="admin-panel admin-user-stat">
                        <span className="admin-user-stat-icon is-active"><CheckCircle2 aria-hidden="true" /></span>
                        <div><small>Akun aktif</small><strong>{summary.active.toLocaleString('id-ID')}</strong></div>
                    </article>
                    <article className="admin-panel admin-user-stat">
                        <span className="admin-user-stat-icon is-suspended"><CircleSlash aria-hidden="true" /></span>
                        <div><small>Akun suspend</small><strong>{summary.suspended.toLocaleString('id-ID')}</strong></div>
                    </article>
                </section>

                <section className="admin-panel admin-users-filter-panel">
                    <form className="admin-users-filters" onSubmit={applyFilters}>
                        <label className="admin-users-search">
                            Cari pengguna
                            <span><Search size={16} aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama atau email" /></span>
                        </label>
                        <label>
                            Status akun
                            <select value={status} onChange={(event) => setStatus(event.target.value)}>
                                <option value="all">Semua status</option>
                                <option value="active">Aktif</option>
                                <option value="suspended">Suspend</option>
                            </select>
                        </label>
                        <div className="admin-users-filter-actions">
                            <Link className="button secondary" href="/admin/users">Reset</Link>
                            <button className="button" type="submit"><Search size={15} aria-hidden="true" /> Cari</button>
                        </div>
                    </form>
                </section>

                <section className="admin-panel admin-users-list-panel">
                    <div className="admin-users-list-heading">
                        <div><h2>Daftar akun</h2><p>{users.total.toLocaleString('id-ID')} pengguna ditemukan</p></div>
                        <ShieldCheck size={21} aria-hidden="true" />
                    </div>
                    {users.data.length ? (
                        <div className="admin-users-list">
                            {users.data.map((user) => (
                                <article className="admin-user-row" key={user.id}>
                                    <div className="admin-user-avatar" aria-hidden="true"><UserRound /></div>
                                    <div className="admin-user-identity">
                                        <strong>{user.name}</strong>
                                        <span>{user.email}</span>
                                        <small>{user.bookings_count} booking · Bergabung {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                                    </div>
                                    <div className="admin-user-state">
                                        <span className={user.is_suspended ? 'is-suspended' : 'is-active'}>
                                            <i aria-hidden="true" /> {user.is_suspended ? 'Suspend' : 'Aktif'}
                                        </span>
                                        {user.is_suspended && user.suspension_reason && <small title={user.suspension_reason}>{user.suspension_reason}</small>}
                                        <small>Peran: {user.roles.join(', ') || 'user'}</small>
                                    </div>
                                    <div className="admin-user-actions">
                                        {user.can_manage ? (
                                            <>
                                                <Link className="button secondary small" href={`/admin/users/${user.encrypted_id}/edit`}><Pencil size={14} aria-hidden="true" /> Edit</Link>
                                                {user.is_suspended ? (
                                                    <button className="button secondary small" type="button" onClick={() => activate(user)}><CheckCircle2 size={14} aria-hidden="true" /> Aktifkan</button>
                                                ) : (
                                                    <button className="button secondary small is-warning" type="button" onClick={() => openSuspend(user)}><CircleSlash size={14} aria-hidden="true" /> Suspend</button>
                                                )}
                                                <button className="icon-button danger" type="button" aria-label={`Hapus akun ${user.name}`} onClick={() => remove(user)}><Trash2 size={16} aria-hidden="true" /></button>
                                            </>
                                        ) : (
                                            <span className="admin-user-protected"><LockKeyhole size={14} aria-hidden="true" /> Dilindungi</span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="admin-users-empty"><Users aria-hidden="true" /><strong>Tidak ada akun yang cocok</strong><p>Coba ubah kata kunci atau status filter.</p></div>
                    )}
                    {users.links && users.links.length > 3 && (
                        <nav className="admin-users-pagination" aria-label="Halaman pengguna">
                            {users.links.map((link, index) => link.url
                                ? <Link key={index} href={link.url} className={link.active ? 'active' : ''} dangerouslySetInnerHTML={{ __html: link.label }} />
                                : <span key={index} className={link.active ? 'active' : ''} dangerouslySetInnerHTML={{ __html: link.label }} />)}
                        </nav>
                    )}
                </section>

                {suspendTarget && (
                    <div className="admin-users-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSuspendTarget(null); }}>
                        <section className="admin-panel admin-users-modal" role="dialog" aria-modal="true" aria-labelledby="suspend-user-title">
                            <div className="admin-users-modal-heading">
                                <span className="admin-user-stat-icon is-suspended"><CircleSlash aria-hidden="true" /></span>
                                <button type="button" className="icon-button" onClick={() => setSuspendTarget(null)} aria-label="Tutup dialog"><X size={17} /></button>
                            </div>
                            <h2 id="suspend-user-title">Suspend akun pengguna?</h2>
                            <p>Akun <strong>{suspendTarget.name}</strong> akan langsung kehilangan akses, termasuk sesi aktif dan login berikutnya.</p>
                            <form onSubmit={submitSuspend}>
                                <label>
                                    Alasan suspend (opsional)
                                    <textarea value={suspension.data.reason} onChange={(event) => suspension.setData('reason', event.target.value)} maxLength={255} rows={3} placeholder="Contoh: aktivitas akun melanggar ketentuan." />
                                    {suspension.errors.reason && <small className="field-error">{suspension.errors.reason}</small>}
                                </label>
                                <div className="admin-users-modal-actions">
                                    <button className="button secondary" type="button" onClick={() => setSuspendTarget(null)}>Batal</button>
                                    <button className="button danger" type="submit" disabled={suspension.processing}>{suspension.processing ? 'Memproses…' : 'Suspend akun'}</button>
                                </div>
                            </form>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
