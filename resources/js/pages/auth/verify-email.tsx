import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, MailCheck, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Verifikasi email" />

            <div className="space-y-6">
                <div className="flex flex-col items-center rounded-lg border border-[#dce5ef] bg-[#f5f8fc] px-5 py-6 text-center">
                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#eaf4ff] text-[#2f74bd]">
                        <MailCheck className="size-8" aria-hidden="true" />
                    </div>
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#2f74bd] ring-1 ring-[#dce5ef]">
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        Satu langkah lagi
                    </span>
                    <h2 className="mb-2 text-xl font-bold text-[#14243f]">Verifikasi email kamu</h2>
                    <p className="mb-0 text-sm leading-6 text-[#66758a]">
                        Kami mengirimkan tautan verifikasi ke email yang kamu daftarkan. Buka email tersebut lalu klik tautannya agar akun bisa digunakan.
                    </p>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span>Tautan verifikasi baru berhasil dikirim. Periksa kotak masuk atau folder spam email kamu.</span>
                    </div>
                )}

                <Form action="/email/verification-notification" method="post" options={{ preserveScroll: true }}>
                    {({ processing, errors }) => (
                        <div className="space-y-3">
                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing ? 'Mengirim email...' : 'Kirim ulang tautan verifikasi'}
                            </Button>
                            <InputError message={errors.email} />
                        </div>
                    )}
                </Form>

                <p className="mb-0 text-center text-sm leading-6 text-[#66758a]">
                    Sudah memverifikasi email?{' '}
                    <TextLink href="/dashboard" className="font-semibold text-[#2f74bd]">
                        Lanjutkan ke dashboard
                    </TextLink>
                </p>

                <div className="border-t border-[#dce5ef] pt-3 text-center">
                    <Form action="/logout" method="post">
                        <Button variant="ghost" type="submit" className="text-sm text-[#66758a]">
                            Keluar dari akun
                        </Button>
                    </Form>
                </div>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi email',
    description: 'Aktifkan akun Sport Center untuk melanjutkan.',
};
