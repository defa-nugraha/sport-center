import { Form, Head } from '@inertiajs/react';
import { ChevronRight, LockKeyhole, Mail } from 'lucide-react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TeamInvitationAlert from '@/components/team-invitation-alert';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import type { TeamInvitationContext } from '@/types';

type Props = {
    status?: string;
    canResetPassword: boolean;
    teamInvitation?: TeamInvitationContext | null;
};

export default function Login({
    status,
    canResetPassword,
    teamInvitation,
}: Props) {
    return (
        <>
            <Head title="Masuk" />

            {teamInvitation && (
                <TeamInvitationAlert
                    invitation={teamInvitation}
                    action="Masuk"
                />
            )}

            {status && (
                <div className="login-status" role="status">
                    {status}
                </div>
            )}

            <div className="login-passkey">
                <PasskeyVerify
                    label="Masuk menggunakan passkey"
                    loadingLabel="Mengautentikasi..."
                    separator="Atau masuk menggunakan email"
                />
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="login-form"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="login-field">
                            <Label className="sr-only" htmlFor="email">
                                Email atau nama pengguna
                            </Label>
                            <Mail aria-hidden="true" />
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder="Email atau nama pengguna"
                                aria-invalid={Boolean(errors.email)}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="login-field">
                            <Label className="sr-only" htmlFor="password">
                                Kata sandi
                            </Label>
                            <LockKeyhole aria-hidden="true" />
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Kata sandi"
                                aria-invalid={Boolean(errors.password)}
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="login-options">
                            <div>
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    aria-label="Ingat saya"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Ingat saya</Label>
                            </div>
                            {canResetPassword && (
                                <TextLink href={request()} tabIndex={5}>
                                    Lupa password?
                                </TextLink>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="login-submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <>
                                    Masuk <ChevronRight aria-hidden="true" />
                                </>
                            )}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Selamat Datang',
    description: 'di Gelanggang Generasi Muda Talaga Manggung Majalengka',
};
