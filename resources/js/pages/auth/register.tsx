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
            <Form action="/register" method="post" className="login-form">
                {({ processing, errors }) => (
                    <>
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
