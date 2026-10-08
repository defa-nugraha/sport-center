import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CalendarCheck,
    ChevronDown,
    Dumbbell,
    FileText,
    Images,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquareText,
    Settings,
    PanelsTopLeft,
    ShieldCheck,
    Trophy,
    UserCog,
    Users,
    Warehouse,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ProductTour } from '@/components/product-tour';

const navItems = [
    { key: 'dashboard', label: 'Dasbor', href: '/admin', icon: LayoutDashboard },
    { key: 'account', label: 'Akun admin', href: '/admin/account', icon: UserCog },
];

const contentItems = [
    { key: 'facilities', label: 'Fasilitas', icon: Warehouse, permission: 'kelola fasilitas', href: '/admin/content?tab=facilities' },
    { key: 'sports', label: 'Olahraga', icon: Dumbbell, permission: 'kelola olahraga', href: '/admin/content?tab=sports' },
    { key: 'events', label: 'Acara', icon: CalendarDays, permission: 'kelola acara', href: '/admin/content?tab=events' },
    { key: 'blog', label: 'Artikel', icon: FileText, permission: 'kelola artikel', href: '/admin/content?tab=blog' },
    { key: 'reviews', label: 'Ulasan', icon: MessageSquareText, permission: 'kelola ulasan', href: '/admin/reviews' },
];

const pageItems = [
    { key: 'sections', label: 'Teks setiap bagian', icon: FileText },
    { key: 'banners', label: 'Banner halaman', icon: Images },
    { key: 'highlights', label: 'Keunggulan beranda', icon: Trophy },
    { key: 'partners', label: 'Jejak kebersamaan', icon: Users },
    { key: 'settings', label: 'Identitas & footer', icon: Settings },
];

export function AdminSidebar({
    active,
    contentSection,
    pageSection,
}: {
    active: string;
    contentSection?: string;
    pageSection?: string;
}) {
    const [contentOpen, setContentOpen] = useState(active === 'content');
    const [pagesOpen, setPagesOpen] = useState(active === 'pages');
    const [bookingOpen, setBookingOpen] = useState(active === 'bookings');
    const [mobileOpen, setMobileOpen] = useState(false);
    const { auth } = usePage().props as any;
    const permissions: string[] = auth?.permissions || [];
    const visibleContentItems = contentItems.filter((item) => permissions.includes(item.permission));

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
        <header className="admin-mobile-bar">
            <Link href="/admin" aria-label="Dasbor admin"><img src="/assets/ilustrasi/logo-ggm.png" alt="GGM Majalengka" /></Link>
            <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? 'Tutup menu admin' : 'Buka menu admin'} aria-expanded={mobileOpen} aria-controls="admin-mobile-navigation">
                {mobileOpen ? <X /> : <Menu />}
            </button>
        </header>
        {mobileOpen && <button className="admin-nav-overlay" type="button" aria-label="Tutup menu admin" onClick={() => setMobileOpen(false)} />}
        <aside id="admin-mobile-navigation" className={`admin-side ${mobileOpen ? 'open' : ''}`}>
            <Link href="/admin" className="admin-brand">
                <img
                    src="/assets/ilustrasi/logo-ggm.png"
                    alt="GGM Majalengka"
                />
            </Link>
            <p className="admin-label">Menu utama</p>
            <nav className="admin-navigation" aria-label="Navigasi admin" data-tour="admin-navigation">
                {navItems.slice(0, 1).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`admin-link ${active === item.key ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <Icon aria-hidden="true" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
                {permissions.includes('kelola booking') && <button
                    type="button"
                    className={`admin-link admin-content-toggle ${active === 'bookings' ? 'active' : ''}`}
                    onClick={() => setBookingOpen((current) => !current)}
                    aria-expanded={bookingOpen}
                    aria-controls="admin-booking-submenu"
                >
                    <CalendarCheck aria-hidden="true" />
                    <span>Kelola Booking</span>
                    <ChevronDown className="collapse-chevron" aria-hidden="true" />
                </button>}
                {permissions.includes('kelola booking') && bookingOpen && (
                    <div className="admin-content-submenu" id="admin-booking-submenu">
                        <Link href="/admin/bookings#settings" className="active-submenu-link" onClick={() => setMobileOpen(false)}>
                            <Settings aria-hidden="true" />
                            <span>Pengaturan venue</span>
                        </Link>
                        <Link href="/admin/bookings#list" className="active-submenu-link" onClick={() => setMobileOpen(false)}>
                            <CalendarDays aria-hidden="true" />
                            <span>Daftar booking</span>
                        </Link>
                    </div>
                )}
                {visibleContentItems.length > 0 && <button
                    type="button"
                    className={`admin-link admin-content-toggle ${active === 'content' ? 'active' : ''}`}
                    onClick={() => setContentOpen((current) => !current)}
                    aria-expanded={contentOpen}
                    aria-controls="admin-content-submenu"
                >
                    <FileText aria-hidden="true" />
                    <span>Kelola konten</span>
                    <ChevronDown className="collapse-chevron" aria-hidden="true" />
                </button>}
                {contentOpen && visibleContentItems.length > 0 && (
                    <div
                        className="admin-content-submenu"
                        id="admin-content-submenu"
                    >
                        {visibleContentItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.key}
                                    href={item.href || `/admin/content?tab=${item.key}`}
                                    className={
                                        contentSection === item.key
                                            ? 'active'
                                            : ''
                                    }
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Icon aria-hidden="true" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
                {permissions.includes('kelola halaman') && <button
                    type="button"
                    className={`admin-link admin-content-toggle ${active === 'pages' ? 'active' : ''}`}
                    onClick={() => setPagesOpen((current) => !current)}
                    aria-expanded={pagesOpen}
                    aria-controls="admin-pages-submenu"
                >
                    <PanelsTopLeft aria-hidden="true" />
                    <span>Tampilan halaman</span>
                    <ChevronDown className="collapse-chevron" aria-hidden="true" />
                </button>}
                {permissions.includes('kelola halaman') && pagesOpen && (
                    <div className="admin-content-submenu" id="admin-pages-submenu">
                        {pageItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.key}
                                    href={`/admin/pages/${item.key}`}
                                    className={pageSection === item.key ? 'active' : ''}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Icon aria-hidden="true" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                )}
                {navItems.slice(1).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`admin-link ${active === item.key ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            <Icon aria-hidden="true" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="admin-side-footer">
                <Link href="/admin/account" className="admin-link">
                    <Settings aria-hidden="true" />
                    <span>Pengaturan</span>
                </Link>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="admin-link"
                >
                    <LogOut aria-hidden="true" />
                    <span>Keluar</span>
                </Link>
            </div>
        </aside>
        <ProductTour
            storageKey="ggm-admin-product-tour-v1"
            steps={[
                { target: '[data-tour="admin-navigation"]', title: 'Navigasi pengelolaan', description: 'Buka modul konten dan tampilan halaman dari menu ini.' },
                { target: '[data-tour="admin-topbar"]', title: 'Konteks halaman', description: 'Judul ini membantu Anda memastikan modul yang sedang dikelola.' },
                { target: '.admin-main > :not(.admin-topbar)', title: 'Area kerja admin', description: 'Data, formulir, serta tindakan tambah dan edit tersedia di area utama ini.' },
                { target: '[data-tour="admin-account"]', title: 'Akun administrator', description: 'Kelola profil, kata sandi, dan passkey melalui menu akun.' },
            ]}
        />
        </>
    );
}

export function AdminTopbar({
    eyebrow = 'Admin pusat',
    title,
    description,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    const { auth } = usePage().props as any;
    return (
        <header className="admin-topbar" data-tour="admin-topbar">
            <div className="admin-topbar-title">
                <span>{eyebrow}</span>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            <div className="admin-topbar-actions">
                {action}
                <Link href="/admin/account" className="admin-user-chip" data-tour="admin-account">
                    <ShieldCheck aria-hidden="true" />
                    <span>
                        <strong>{auth?.user?.name || 'Administrator'}</strong>
                        <small>Administrator GGM</small>
                    </span>
                </Link>
            </div>
        </header>
    );
}
