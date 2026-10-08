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

    if (url.startsWith('/login') || url.startsWith('/register')) {
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
