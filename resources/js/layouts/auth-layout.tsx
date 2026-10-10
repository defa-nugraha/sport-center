import { usePage } from '@inertiajs/react';
import AuthLoginLayout from '@/layouts/auth/auth-login-layout';
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    const { url } = usePage();

    const usesBrandedLayout =
        url.startsWith('/login') ||
        url.startsWith('/register') ||
        url.startsWith('/forgot-password') ||
        url.startsWith('/reset-password') ||
        url.startsWith('/email/verify');

    if (usesBrandedLayout) {
        return (
            <AuthLoginLayout title={title} description={description}>
                {children}
            </AuthLoginLayout>
        );
    }

    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
        </AuthLayoutTemplate>
    );
}
