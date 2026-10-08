import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { index as teams } from '@/routes/teams';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    { title: 'Profile', href: edit(), icon: null },
    { title: 'Security', href: editSecurity(), icon: null },
    { title: 'Teams', href: teams(), icon: null },
    { title: 'Appearance', href: editAppearance(), icon: null },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="account-shell">
            <header className="account-header">
                <span className="eyebrow"><i /> Pengaturan akun</span>
                <h1>Pengaturan</h1>
                <p>Kelola profil, keamanan, tim, dan tampilan akunmu.</p>
            </header>
            <div className="account-layout">
                <aside className="account-sidebar">
                    <nav aria-label="Navigasi pengaturan akun">
                        {sidebarNavItems.map((item, index) => {
                            const active = isCurrentOrParentUrl(item.href);
                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={`account-nav-link ${active ? 'active' : ''}`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
                <main className="account-content">{children}</main>
            </div>
        </div>
    );
}