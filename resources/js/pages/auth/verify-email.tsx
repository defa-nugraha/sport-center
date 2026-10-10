import { Form, Head, Link } from '@inertiajs/react';
import { CheckCircle2, MailCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import TextLink from '@/components/text-link';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Verifikasi email" />
            <div className="mx-auto w-full max-w-md space-y-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MailCheck className="size-7" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Verifikasi email kamu</h1>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Kami sudah mengirim tautan verifikasi ke alamat email yang kamu daftarkan.
                        Buka email tersebut dan klik tautannya untuk mengaktifkan akun.
                    </p>
                </div>
                {status === 'verification-link-sent' && (
                    <div className="flex items-center justify-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700" role="status">
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        Tautan verifikasi baru berhasil dikirim.
                    </div>
                )}
                <Form action="/email/verification-notification" method="post" options={{ preserveScroll: true }}>
                    {({ processing, errors }) => (
                        <div className="space-y-3">
                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing ? 'Mengirim...' : 'Kirim ulang email verifikasi'}
                            </Button>
                            <InputError message={errors.email} />
                        </div>
                    )}
                </Form>
                <p className="text-sm text-muted-foreground">
                    Sudah memverifikasi email? <TextLink href="/dashboard">Lanjutkan ke dashboard</TextLink>
                </p>
                <Form action="/logout" method="post">
                    <Button variant="ghost" type="submit" className="text-sm">Keluar dari akun</Button>
                </Form>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi email',
    description: 'Verifikasi alamat email untuk mengaktifkan akun',
};
