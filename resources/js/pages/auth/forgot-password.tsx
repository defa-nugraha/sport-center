import { Form, Head } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
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

            <div className="space-y-6">
                <section className="relative isolate overflow-hidden rounded-2xl border border-[#dce5ef] bg-gradient-to-br from-white via-[#f5f8fc] to-[#eaf4ff] p-5 sm:p-6">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 -z-10 size-36 rounded-full bg-[#2f74bd]/10 blur-2xl" />
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#14243f] text-white shadow-lg shadow-[#14243f]/15">
                            <KeyRound className="size-6" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#dce5ef] bg-white/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2f74bd]">
                                <Sparkles className="size-3.5" aria-hidden="true" />
                                Pemulihan akun
                            </span>
                            <h2 className="text-xl font-extrabold tracking-tight text-[#14243f] sm:text-2xl">
                                Lupa password?
                            </h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-[#66758a]">
                                Tidak masalah. Masukkan email akunmu dan kami akan mengirimkan tautan aman untuk membuat password baru.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-2 border-t border-[#dce5ef] pt-4 text-xs font-medium text-[#52637a] sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 shrink-0 text-[#2f74bd]" aria-hidden="true" />
                            Tautan pemulihan yang aman
                        </div>
                        <div className="flex items-center gap-2">
                            <LockKeyhole className="size-4 shrink-0 text-[#2f74bd]" aria-hidden="true" />
                            Password lama tetap terlindungi
                        </div>
                    </div>
                </section>

                {status && (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800" role="status">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        <p className="m-0">{status}</p>
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
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8291a6]" aria-hidden="true" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoComplete="email"
                                        autoFocus
                                        placeholder="nama@email.com"
                                        className="h-12 rounded-xl border-[#dce5ef] bg-white pl-12 pr-4 shadow-sm transition placeholder:text-[#9aa7b7] focus-visible:border-[#2f74bd] focus-visible:ring-[#2f74bd]/20"
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                                    />
                                </div>
                                <InputError message={errors.email} />
                                {!errors.email && (
                                    <p id="email-hint" className="m-0 text-xs leading-5 text-[#8291a6]">
                                        Pastikan kamu masih bisa membuka inbox email tersebut.
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-[#14243f] font-semibold text-white shadow-md shadow-[#14243f]/15 transition hover:bg-[#20395f]"
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
                                        Kirim tautan pemulihan
                                        <Mail className="ml-2 size-4" aria-hidden="true" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </Form>

                <div className="flex flex-col items-center gap-3 border-t border-[#dce5ef] pt-5">
                    <TextLink href={login()} className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f74bd] transition hover:text-[#14243f]">
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Kembali ke halaman masuk
                    </TextLink>
                    <p className="m-0 max-w-sm text-center text-xs leading-5 text-[#8291a6]">
                        Demi keamanan, gunakan tautan pemulihan yang paling baru dan jangan bagikan tautan tersebut kepada siapa pun.
                    </p>
                </div>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Pulihkan akses akun',
    description: 'Kami bantu kamu kembali ke Sport Center dengan aman.',
};
