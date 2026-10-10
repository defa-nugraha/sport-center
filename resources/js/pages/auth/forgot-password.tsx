import { Form, Head } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Mail,
} from 'lucide-react';
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

            <main className="flex min-h-[calc(100svh-3rem)] w-full items-center justify-center px-4 py-10 sm:px-6">
                <section className="w-full max-w-md rounded-2xl border border-[#dce5ef] bg-white p-6 shadow-xl shadow-[#14243f]/8 sm:p-8">
                    <header className="mb-7">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f74bd]">Sport Center</p>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#14243f] sm:text-3xl">
                            Lupa password?
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-[#52637a]">
                            Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan untuk membuat password baru.
                        </p>
                    </header>

                    {status && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800" role="status">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                                <p className="m-0">{status}</p>
                            </div>
                        </div>
                    )}

                    <Form {...email.form()} resetOnSuccess={['email']}>
                        {({ processing, errors }) => (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold text-[#14243f]">
                                        Email yang terdaftar
                                    </Label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-[#8291a6]" aria-hidden="true" />
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoComplete="email"
                                            autoFocus
                                            placeholder="nama@email.com"
                                            className="h-12 w-full rounded-xl border-[#cbd8e6] bg-white pl-11 pr-4 text-[#14243f] shadow-sm placeholder:text-[#8291a6] focus-visible:border-[#2f74bd] focus-visible:ring-[#2f74bd]/25"
                                            aria-invalid={Boolean(errors.email)}
                                            aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                    {!errors.email && (
                                        <p id="email-hint" className="m-0 text-xs leading-5 text-[#66758a]">
                                            Pastikan kamu masih bisa membuka inbox email tersebut.
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="h-12 w-full rounded-xl bg-[#14243f] font-semibold text-white shadow-md shadow-[#14243f]/15 transition hover:bg-[#20395f] hover:text-white"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing ? (
                                        <>
                                            <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                                            Mengirim tautan...
                                        </>
                                    ) : (
                                        <>
                                            Kirim tautan reset password
                                            <Mail className="ml-2 size-4" aria-hidden="true" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </Form>

                    <footer className="mt-7 border-t border-[#e5ebf2] pt-5 text-center">
                        <TextLink href={login()} className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f74bd] transition hover:text-[#14243f]">
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Kembali ke halaman masuk
                        </TextLink>
                    </footer>
                </section>
            </main>
        </>
    );
}

ForgotPassword.layout = null;
