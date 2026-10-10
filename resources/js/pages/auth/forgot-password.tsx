import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Lupa password" />

            <div className="space-y-6">
                <div className="rounded-lg border border-[#dce5ef] bg-[#f5f8fc] p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#14243f]">
                        <ShieldCheck className="size-4 text-[#2f74bd]" aria-hidden="true" />
                        Pemulihan akun aman
                    </div>
                    <p className="mb-0 text-sm leading-6 text-[#66758a]">
                        Masukkan email yang terhubung dengan akun Sport Center. Kami akan mengirimkan tautan untuk membuat password baru.
                    </p>
                </div>

                {status && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700" role="status">
                        {status}
                    </div>
                )}

                <Form {...email.form()} resetOnSuccess={['email']}>
                    {({ processing, errors }) => (
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat email</Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66758a]" aria-hidden="true" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoComplete="email"
                                        autoFocus
                                        placeholder="nama@email.com"
                                        className="pl-10"
                                        aria-invalid={Boolean(errors.email)}
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <Button className="w-full" disabled={processing} data-test="email-password-reset-link-button">
                                {processing ? 'Mengirim tautan...' : 'Kirim tautan reset password'}
                            </Button>
                        </div>
                    )}
                </Form>

                <div className="border-t border-[#dce5ef] pt-4">
                    <TextLink href={login()} className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f74bd]">
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Kembali ke halaman masuk
                    </TextLink>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Lupa password?',
    description: 'Pulihkan akses akun Sport Center dengan mudah dan aman.',
};
