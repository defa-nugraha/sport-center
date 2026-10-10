import { useForm, usePage } from '@inertiajs/react';
import { StatusDialog } from '@/components/admin-cms';
import { useEffect, useState } from 'react';
import { Save, UserRound } from 'lucide-react';
import { UserShell } from '@/components/user-layout';

export default function Profile({ user }: any) {
    const form = useForm({ name: user.name || '', email: user.email || '' });
    const { flash } = usePage().props as any;
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);
    return (
        <UserShell active="profile" title="Profil Saya" description="Perbarui informasi akun yang digunakan untuk booking dan notifikasi.">
            <section className="user-panel profile-panel">
                <div className="user-panel-head"><div><span className="eyebrow"><i /> Informasi akun</span><h2>Data pribadi</h2><p>Gunakan email aktif agar informasi booking mudah diterima.</p></div><UserRound /></div>
                <form onSubmit={(event) => { event.preventDefault(); form.patch('/profile', {
                    preserveScroll: true,
                    onSuccess: () => setStatus({ type: 'success', message: 'Profil berhasil diperbarui.' }),
                    onError: (errors) => setStatus({ type: 'error', message: Object.values(errors)[0] || 'Profil gagal diperbarui. Periksa kembali data Anda.' }),
                }); }} className="user-profile-form">
                    <label>Nama lengkap<input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></label>
                    <label>Email<input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} /></label>
                    {Object.values(form.errors).map((error, index) => <small className="form-error" key={index}>{error}</small>)}
                    <button className="button" disabled={form.processing}><Save /> {form.processing ? 'Menyimpan...' : 'Simpan perubahan'}</button>
                </form>
            </section>
            <StatusDialog open={Boolean(status)} onOpenChange={(open) => !open && setStatus(null)} type={status?.type || 'success'} message={status?.message || ''} />
        </UserShell>
    );
}
