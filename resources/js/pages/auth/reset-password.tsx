import { Form, Head } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Buat kata sandi baru" />

            <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-lg border border-[#dce5ef] bg-[#f5f8fc] p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eaf4ff] text-[#2f74bd]">
                        <KeyRound className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h2 className="mb-1 text-base font-bold text-[#14243f]">Buat kata sandi baru</h2>
                        <p className="mb-0 text-sm leading-5 text-[#66758a]">
                            Gunakan kata sandi yang kuat dan jangan bagikan kepada siapa pun.
                        </p>
                    </div>
                </div>

                <Form
                    {...update.form()}
                    transform={(data) => ({ ...data, token, email })}
                    resetOnSuccess={['password', 'password_confirmation']}
                >
                    {({ processing, errors }) => (
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    className="w-full"
                                    readOnly
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Kata sandi baru</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    className="w-full"
                                    required
                                    autoFocus
                                    placeholder="Masukkan kata sandi baru"
                                    passwordrules={passwordRules}
                                    aria-invalid={Boolean(errors.password)}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Konfirmasi kata sandi baru</Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    className="w-full"
                                    required
                                    placeholder="Ulangi kata sandi baru"
                                    passwordrules={passwordRules}
                                    aria-invalid={Boolean(errors.password_confirmation)}
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <div className="flex items-start gap-2 text-xs leading-5 text-[#66758a]">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#2f74bd]" aria-hidden="true" />
                                Pastikan konfirmasi kata sandi sama dengan kata sandi baru.
                            </div>

                            <Button type="submit" className="mt-1 w-full" disabled={processing} data-test="reset-password-button">
                                {processing ? <Spinner /> : 'Simpan kata sandi baru'}
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
}

ResetPassword.layout = {
    title: 'Atur ulang kata sandi',
    description: 'Kembalikan akses ke akun Sport Center kamu.',
};
