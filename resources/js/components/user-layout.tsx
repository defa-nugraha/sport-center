import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarCheck, CalendarDays, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { asset } from '@/components/public-site';

export function UserShell({ active, title, description, children }: { active: string; title?: string; description?: string; children: React.ReactNode }) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    return (
        <>
            {title && <Head title={title} />}
            <header className="site-header user-site-header">
                <Link href="/" className="header-brand" aria-label="GGM Majalengka home"><img src={asset('/assets/ilustrasi/logo-ggm.png')} alt="GGM Majalengka" /></Link>
                <nav className="user-main-nav" aria-label="Menu akun">
                    <Link href="/dashboard" className={active === 'dashboard' ? 'active' : ''}><LayoutDashboard /> Dashboard</Link>
                    <Link href="/booking" className={active === 'booking' ? 'active' : ''}><CalendarCheck /> Booking</Link>
                    <Link href="/bookings" className={active === 'bookings' ? 'active' : ''}><CalendarDays /> Riwayat</Link>
                    <Link href="/profile" className={active === 'profile' ? 'active' : ''}><UserRound /> Profil</Link>
                </nav>
                <div className="user-header-account"><span>{user?.name || 'Pengguna'}</span><Link href="/logout" method="post" as="button" aria-label="Keluar"><LogOut /></Link></div>
            </header>
            <main className="user-main">
                <div className="user-container">
                    {description && <div className="user-page-intro"><span className="eyebrow"><i /> Area pelanggan</span><h1>{title}</h1><p>{description}</p></div>}
                    {children}
                </div>
            </main>
            <footer className="footer user-footer">
                <div className="footer-about"><Link href="/" className="footer-logo"><img src={asset('/assets/ilustrasi/logo-ggm.png')} alt="GGM Majalengka" /></Link><p>Temukan olahraga favoritmu dan ruang terbaik untuk bergerak.</p></div>
                <div className="footer-links"><strong>Area pelanggan</strong><Link href="/dashboard">Dashboard</Link><Link href="/booking">Booking</Link><Link href="/bookings">Riwayat</Link><Link href="/profile">Profil</Link></div>
                <small>&copy; 2026 GGM Majalengka. Seluruh hak cipta dilindungi.</small>
            </footer>
        </>
    );
}
