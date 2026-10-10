import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { StatusDialog } from '@/components/admin-cms';
import ManagePasskeys from '@/components/manage-passkeys';
import PasswordInput from '@/components/password-input';
import { Head, useForm, usePage } from '@inertiajs/react';
import { KeyRound, Save, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AdminAccountSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function AdminAccount({
    canManagePasskeys,
    passkeys,
    passwordRules,
}: any) {
    const loading = usePageLoading();
    const { auth, flash } = usePage().props as any;
    const [status, setStatus] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const currentPassword = useRef<HTMLInputElement>(null);
    const profile = useForm({
        name: auth.user.name || '',
        email: auth.user.email || '',
    });
    const password = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);

    const fail = (errors: Record<string, string>) =>
        setStatus({
            type: 'error',
            message:
                Object.values(errors)[0] ||
                'Periksa kembali data yang Anda masukkan.',
        });
    const submitProfile = (event: FormEvent) => {
        event.preventDefault();
        profile.patch('/admin/account', {
            preserveScroll: true,
            onSuccess: () => setStatus({ type: 'success', message: 'Profil akun berhasil diperbarui.' }),
            onError: fail,
        });
    };
    const submitPassword = (event: FormEvent) => {
        event.preventDefault();
        password.put('/admin/account/password', {
            preserveScroll: true,
            onSuccess: () => {
                password.reset();
                setStatus({ type: 'success', message: 'Kata sandi berhasil diperbarui.' });
            },
            onError: (errors) => {
                fail(errors);
                if (errors.current_password) currentPassword.current?.focus();
            },
        });
    };

    if (loading) return <AdminAccountSkeleton />;
    return (
        <div className="admin-shell">
            <Head title="Akun admin" />
            <AdminSidebar active="account" />
            <main className="admin-main">
                <AdminTopbar
                    title="Akun Admin"
                    description="Kelola identitas, kata sandi, dan metode masuk akun Anda."
                />
                <div className="admin-account-grid">
                    <section className="admin-panel account-panel">
                        <div className="account-panel-heading">
                            <UserRound aria-hidden="true" />
                            <div>
                                <h2>Informasi akun</h2>
                                <p>Perbarui nama dan alamat email administrator.</p>
                            </div>
                        </div>
                        <form className="cms-form" onSubmit={submitProfile}>
                            <label>
                                Nama lengkap
                                <input
                                    required
                                    value={profile.data.name}
                                    onChange={(event) =>
                                        profile.setData('name', event.target.value)
                                    }
                                />
                                {profile.errors.name && <small className="field-error">{profile.errors.name}</small>}
                            </label>
                            <label>
                                Alamat email
                                <input
                                    type="email"
                                    required
                                    value={profile.data.email}
                                    onChange={(event) =>
                                        profile.setData('email', event.target.value)
                                    }
                                />
                                {profile.errors.email && <small className="field-error">{profile.errors.email}</small>}
                            </label>
                            <button className="button" disabled={profile.processing}>
                                <Save aria-hidden="true" /> Simpan profil
                            </button>
                        </form>
                    </section>
                    <section className="admin-panel account-panel">
                        <div className="account-panel-heading">
                            <KeyRound aria-hidden="true" />
                            <div>
                                <h2>Ubah kata sandi</h2>
                                <p>Gunakan kata sandi kuat yang tidak dipakai di layanan lain.</p>
                            </div>
                        </div>
                        <form className="cms-form" onSubmit={submitPassword}>
                            <label>
                                Kata sandi saat ini
                                <PasswordInput
                                    ref={currentPassword}
                                    value={password.data.current_password}
                                    onChange={(event) => password.setData('current_password', event.target.value)}
                                    autoComplete="current-password"
                                />
                            </label>
                            <label>
                                Kata sandi baru
                                <PasswordInput
                                    value={password.data.password}
                                    onChange={(event) => password.setData('password', event.target.value)}
                                    autoComplete="new-password"
                                    passwordrules={passwordRules}
                                />
                            </label>
                            <label>
                                Konfirmasi kata sandi baru
                                <PasswordInput
                                    value={password.data.password_confirmation}
                                    onChange={(event) => password.setData('password_confirmation', event.target.value)}
                                    autoComplete="new-password"
                                    passwordrules={passwordRules}
                                />
                            </label>
                            <button className="button" disabled={password.processing}>
                                <Save aria-hidden="true" /> Simpan kata sandi
                            </button>
                        </form>
                    </section>
                    <section className="admin-panel account-panel account-passkeys">
                        <ManagePasskeys
                            canManagePasskeys={canManagePasskeys}
                            passkeys={passkeys}
                        />
                    </section>
                </div>
                <StatusDialog
                    open={Boolean(status)}
                    onOpenChange={(open) => !open && setStatus(null)}
                    type={status?.type || 'success'}
                    message={status?.message || ''}
                />
            </main>
        </div>
    );
}
