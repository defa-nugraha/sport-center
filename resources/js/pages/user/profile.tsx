import { useForm } from '@inertiajs/react';
import { Save, UserRound } from 'lucide-react';
import { UserShell } from '@/components/user-layout';

export default function Profile({ user }: any) {
    const form = useForm({ name: user.name || '', email: user.email || '' });
    return (
        <UserShell active="profile" title="Profil Saya" description="Perbarui informasi akun yang digunakan untuk booking dan notifikasi.">
            <section className="user-panel profile-panel">
                <div className="user-panel-head"><div><span className="eyebrow"><i /> Informasi akun</span><h2>Data pribadi</h2><p>Gunakan email aktif agar informasi booking mudah diterima.</p></div><UserRound /></div>
                <form onSubmit={(event) => { event.preventDefault(); form.patch('/profile', { preserveScroll: true }); }} className="user-profile-form">
                    <label>Nama lengkap<input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></label>
                    <label>Email<input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} /></label>
                    {Object.values(form.errors).map((error, index) => <small className="form-error" key={index}>{error}</small>)}
                    <button className="button" disabled={form.processing}><Save /> {form.processing ? 'Menyimpan...' : 'Simpan perubahan'}</button>
                </form>
            </section>
        </UserShell>
    );
}
