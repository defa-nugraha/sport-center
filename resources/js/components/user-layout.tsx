import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarCheck, CalendarDays, LayoutDashboard, LogOut, Menu, UserRound, X, Bell } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { asset } from '@/components/public-site';
import { NotificationBell } from '@/components/notification-bell';

const menuItems = [
    { key: 'dashboard', label: 'Dasbor', href: '/dashboard', icon: LayoutDashboard },
    { key: 'booking', label: 'Booking', href: '/booking', icon: CalendarCheck },
    { key: 'bookings', label: 'Riwayat', href: '/bookings', icon: CalendarDays },
    { key: 'notifications', label: 'Notifikasi', href: '/notifications', icon: Bell },
    { key: 'profile', label: 'Profil', href: '/profile', icon: UserRound },
];

export function UserShell({
    active,
    title,
    description,
    children,
}: {
    active: string;
    title?: string;
    description?: string;
    children: ReactNode;
}) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (!mobileOpen) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileOpen(false);
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [mobileOpen]);

    return (
        <>
            {title && <Head title={title} />}
            <header className="user-mobile-bar">
                <Link href="/dashboard" aria-label="Dasbor pelanggan">
                    <img src={asset('/assets/ilustrasi/logo-ggm.png')} alt="GGM Majalengka" />
                </Link>
                <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Tutup menu pelanggan' : 'Buka menu pelanggan'} aria-expanded={mobileOpen} aria-controls="user-navigation">
                    {mobileOpen ? <X /> : <Menu />}
                </button>
            </header>
            {mobileOpen && <button className="user-nav-overlay" type="button" aria-label="Tutup menu pelanggan" onClick={() => setMobileOpen(false)} />}
            <div className="user-shell">
                <aside id="user-navigation" className={'user-side ' + (mobileOpen ? 'open' : '')}>
                    <Link href="/dashboard" className="user-brand" onClick={() => setMobileOpen(false)}>
                        <img src={asset('/assets/ilustrasi/logo-ggm.png')} alt="GGM Majalengka" />
                    </Link>
                    <p className="user-label">Menu utama</p>
                    <nav className="user-navigation" aria-label="Navigasi pelanggan">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.key} href={item.href} className={'user-link ' + (active === item.key ? 'active' : '')} aria-current={active === item.key ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
                                    <Icon aria-hidden="true" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="user-side-account">
                        <div className="user-side-profile">
                            <span className="user-side-avatar"><UserRound aria-hidden="true" /></span>
                            <span><strong>{user?.name || 'Pengguna'}</strong><small>Akun pelanggan</small></span>
                        </div>
                        <Link href="/logout" method="post" as="button" className="user-link" onClick={() => setMobileOpen(false)}>
                            <LogOut aria-hidden="true" />
                            <span>Keluar</span>
                        </Link>
                    </div>
                </aside>
                <div className="user-workspace">
                    <header className="user-topbar">
                        <div><span>Area pelanggan</span><strong>{title || 'GGM Majalengka'}</strong></div>
                        <div className="user-topbar-account"><NotificationBell /><span>{user?.name || 'Pengguna'}</span><UserRound aria-hidden="true" /></div>
                    </header>
                    <main className="user-main">
                        <div className="user-container">
                            {description && <div className="user-page-intro"><span className="eyebrow"><i /> Area pelanggan</span><p>{description}</p></div>}
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
