import { Form, Head } from '@inertiajs/react';
import { ChevronRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import TextLink from '@/components/text-link';

export default function Register({ redirect }: { redirect?: string }) {
    return (
        <>
            <Head title="Daftar akun" />
            <a href="/auth/google" className="login-google"><svg className="google-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.64 5.93c4.46-4.12 7.13-10.2 7.13-17.58Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.87l-7.64-5.93c-2.12 1.42-4.84 2.27-8.26 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>Daftar dengan Google</a>
            <div className="login-google-divider" aria-hidden="true">Atau isi formulir</div>
            <Form action="/register" method="post" className="login-form" options={{ preserveScroll: true }}>
                {({ processing, errors }) => (
                    <>
                        {errors.google && <p className="login-status" role="alert">{errors.google}</p>}
                        <input type="hidden" name="redirect" value={redirect || ''} />
                        <div className="login-field">
                            <Label className="sr-only" htmlFor="name">Nama lengkap</Label>
                            <UserRound aria-hidden="true" />
                            <Input id="name" name="name" required autoFocus autoComplete="name" placeholder="Nama lengkap" aria-invalid={Boolean(errors.name)} />
                            <InputError message={errors.name} />
                        </div>
                        <div className="login-field">
                            <Label className="sr-only" htmlFor="email">Email</Label>
                            <Mail aria-hidden="true" />
                            <Input id="email" type="email" name="email" required autoComplete="email" placeholder="Email aktif" aria-invalid={Boolean(errors.email)} />
                            <InputError message={errors.email} />
                        </div>
                        <div className="login-field">
                            <Label className="sr-only" htmlFor="password">Kata sandi</Label>
                            <LockKeyhole aria-hidden="true" />
                            <PasswordInput id="password" name="password" required autoComplete="new-password" placeholder="Kata sandi" aria-invalid={Boolean(errors.password)} />
                            <InputError message={errors.password} />
                        </div>
                        <div className="login-field">
                            <Label className="sr-only" htmlFor="password_confirmation">Konfirmasi kata sandi</Label>
                            <LockKeyhole aria-hidden="true" />
                            <PasswordInput id="password_confirmation" name="password_confirmation" required autoComplete="new-password" placeholder="Ulangi kata sandi" aria-invalid={Boolean(errors.password_confirmation)} />
                            <InputError message={errors.password_confirmation} />
                        </div>
                        <p className="auth-password-hint">Gunakan kata sandi yang aman dan mudah kamu ingat.</p>
                        <Button type="submit" className="login-submit" disabled={processing}>
                            {processing ? <Spinner /> : <>Buat Akun <ChevronRight aria-hidden="true" /></>}
                        </Button>
                        <p className="auth-switch">
                            Sudah punya akun? <TextLink href="/login">Masuk di sini</TextLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Buat Akun',
    description: 'Daftar untuk memesan fasilitas olahraga GGM Majalengka.',
};
