import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import '../../../../css/admin-users.css';

type UserFormProps = {
    user: null | {
        id: number;
        encrypted_id: string;
        name: string;
        email: string;
        is_suspended: boolean;
        suspension_reason?: string | null;
    };
    mode: 'create' | 'edit';
};

export default function AdminUserForm({ user, mode }: UserFormProps) {
    const editing = mode === 'edit' && user !== null;
    const { flash } = usePage().props as any;
    const [message, setMessage] = useState('');
    const form = useForm({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (flash?.error) setMessage(flash.error);
    }, [flash?.error]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setMessage(editing ? 'Data pengguna berhasil diperbarui.' : 'Akun pengguna berhasil dibuat.'),
            onError: (errors: Record<string, string>) => setMessage(Object.values(errors)[0] || 'Data gagal disimpan. Periksa kembali isian.'),
        };
        if (editing && user) {
            form.put(`/admin/users/${user.encrypted_id}`, options);
        } else {
            form.post('/admin/users', options);
        }
    };

    return (
        <div className="admin-shell">
            <Head title={editing ? 'Edit Pengguna' : 'Tambah Pengguna'} />
            <AdminSidebar active="users" />
            <main className="admin-main admin-users-page">
                <AdminTopbar title={editing ? 'Edit Pengguna' : 'Tambah Pengguna'} description="Kelola data dasar akun pelanggan." />
                <Link href="/admin/users" className="booking-back-link"><ArrowLeft aria-hidden="true" /> Kembali ke daftar pengguna</Link>
                <div className="admin-page-heading admin-users-heading">
                    <div>
                        <span className="eyebrow">MANAJEMEN AKUN</span>
                        <h1>{editing ? 'Perbarui data pengguna' : 'Buat akun pengguna'}</h1>
                        <p>Halaman ini hanya untuk akun pelanggan. Peran akan otomatis diatur menjadi user.</p>
                    </div>
                </div>
                {message && <div className="admin-users-flash" role="status">{message}</div>}
                <section className="admin-panel admin-user-form-panel">
                    <div className="admin-users-list-heading">
                        <div><h2>Informasi akun</h2><p>{editing ? 'Kosongkan kata sandi jika tidak ingin mengubahnya.' : 'Gunakan email yang dapat diakses oleh pelanggan.'}</p></div>
                        <UserRound aria-hidden="true" />
                    </div>
                    {editing && user?.is_suspended && (
                        <div className="admin-users-notice"><strong>Akun sedang suspend.</strong> Aktifkan dari daftar pengguna setelah meninjau alasan suspend.</div>
                    )}
                    <form className="admin-user-form" onSubmit={submit}>
                        <label>
                            Nama lengkap
                            <input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} required maxLength={255} autoComplete="name" />
                            {form.errors.name && <small className="field-error">{form.errors.name}</small>}
                        </label>
                        <label>
                            Email
                            <input type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} required maxLength={255} autoComplete="email" />
                            {form.errors.email && <small className="field-error">{form.errors.email}</small>}
                        </label>
                        <label>
                            Kata sandi {editing && <small>(opsional)</small>}
                            <input type="password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} required={!editing} autoComplete={editing ? 'new-password' : 'new-password'} />
                            {form.errors.password && <small className="field-error">{form.errors.password}</small>}
                        </label>
                        <label>
                            Konfirmasi kata sandi
                            <input type="password" value={form.data.password_confirmation} onChange={(event) => form.setData('password_confirmation', event.target.value)} required={!editing || !!form.data.password} autoComplete="new-password" />
                        </label>
                        {form.errors.password_confirmation && <small className="field-error">{form.errors.password_confirmation}</small>}
                        <div className="admin-user-form-actions">
                            <Link href="/admin/users" className="button secondary">Batal</Link>
                            <button className="button" type="submit" disabled={form.processing}><Save size={16} aria-hidden="true" /> {form.processing ? 'Menyimpan…' : 'Simpan pengguna'}</button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
