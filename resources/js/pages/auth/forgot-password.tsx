import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
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

            <main className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden bg-[#f4f7fb] px-4 py-10 sm:px-6">
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
                    <div className="absolute -left-32 -top-36 size-[28rem] rounded-full bg-[#dceaff]/70 blur-3xl" />
                    <div className="absolute -bottom-48 -right-24 size-[30rem] rounded-full bg-[#e3eaf5]/80 blur-3xl" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),transparent_55%)]" />
                </div>

                <section className="w-full max-w-[440px] overflow-hidden rounded-[24px] border border-white/90 bg-white/95 shadow-[0_24px_80px_-32px_rgba(20,36,63,0.24)] ring-1 ring-[#14243f]/[0.04]">
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#14243f] via-[#2f74bd] to-[#83b8ed]" />
                    <div className="px-6 py-8 sm:px-10 sm:py-10">
                        <header className="mb-8">
                            <p className="mb-8 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#2f74bd]">
                                SPORT CENTER
                            </p>
                            <h1 className="text-xl font-bold leading-tight tracking-[-0.02em] text-[#14243f] sm:text-2xl">
                                Lupa kata sandi?
                            </h1>
                            <p className="mt-4 max-w-[34ch] text-[14px] leading-6 text-[#5b687b]">
                                Tidak masalah. Masukkan email akunmu dan kami akan mengirimkan tautan untuk membuat kata sandi baru.
                            </p>
                        </header>

                        {status && (
                            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm leading-6 text-emerald-800" role="status">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                                    <p className="m-0">{status}</p>
                                </div>
                            </div>
                        )}

                        <Form {...email.form()} resetOnSuccess={['email']}>
                            {({ processing, errors }) => (
                                <div className="space-y-5">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="email" className="text-[13px] font-semibold text-[#263750]">
                                            Alamat email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoComplete="email"
                                            autoFocus
                                            placeholder="nama@email.com"
                                            className="h-[52px] w-full rounded-xl border-[#d7e0eb] bg-[#fbfcfe] px-4 text-[15px] text-[#14243f] shadow-none transition placeholder:text-[#98a4b5] hover:border-[#b9c9dc] focus-visible:border-[#2f74bd] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#2f74bd]/10"
                                            aria-invalid={Boolean(errors.email)}
                                            aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                                        />
                                        <InputError message={errors.email} />
                                        {!errors.email && (
                                            <p id="email-hint" className="m-0 pt-0.5 text-xs leading-5 text-[#778397]">
                                                Gunakan email yang kamu pakai saat mendaftar.
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-[52px] w-full rounded-xl bg-[#14243f] text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(20,36,63,0.55)] transition duration-200 hover:-translate-y-px hover:bg-[#20395f] hover:text-white focus-visible:ring-4 focus-visible:ring-[#2f74bd]/25"
                                        disabled={processing}
                                        data-test="email-password-reset-link-button"
                                    >
                                        {processing ? (
                                            <>
                                                <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                                                Mengirim tautan...
                                            </>
                                        ) : (
                                            'Kirim tautan pemulihan kata sandi'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </Form>

                        <footer className="mt-7 border-t border-[#edf0f5] pt-6 text-center">
                            <TextLink href={login()} className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#526782] transition hover:text-[#2f74bd]">
                                <ArrowLeft className="size-4" aria-hidden="true" />
                                Kembali ke halaman masuk
                            </TextLink>
                        </footer>
                    </div>
                </section>
            </main>
        </>
    );
}

ForgotPassword.layout = null;
