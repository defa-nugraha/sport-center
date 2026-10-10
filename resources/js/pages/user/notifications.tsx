import { Link, router } from '@inertiajs/react';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserShell } from '@/components/user-layout';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    url: string;
    created_at?: string | null;
    read_at?: string | null;
};

export default function Notifications({ notifications }: { notifications: any }) {
    const items: NotificationItem[] = notifications.data ?? [];

    const openNotification = (item: NotificationItem) => {
        const destination = item.url || '/dashboard';
        if (!item.read_at) {
            router.post('/notifications/' + encodeURIComponent(item.id) + '/read', {}, {
                preserveScroll: true,
                onSuccess: () => router.visit(destination),
            });
            return;
        }
        router.visit(destination);
    };

    return (
        <UserShell active="notifications" title="Semua Notifikasi" description="Pantau informasi terbaru tentang booking dan aktivitas akun kamu.">
            <section className="user-panel space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{notifications.total ?? items.length} notifikasi · {items.filter((item) => !item.read_at).length} belum dibaca di halaman ini</p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!items.some((item) => !item.read_at)}
                        onClick={() => router.post('/notifications/read-all', {}, { preserveScroll: true })}
                    >
                        <CheckCheck className="mr-2 size-4" /> Tandai semua dibaca
                    </Button>
                </div>

                {items.length ? (
                    <div className="divide-y rounded-xl border bg-background">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => openNotification(item)}
                                className={'flex w-full items-start gap-3 rounded-none px-4 py-4 text-left transition-colors hover:bg-muted ' + (!item.read_at ? 'bg-primary/5' : '')}
                            >
                                <span className={'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ' + (!item.read_at ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                                    <Bell className="size-5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold">{item.title}</span>
                                        {!item.read_at && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Baru</span>}
                                    </span>
                                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{item.message}</span>
                                    <span className="mt-2 block text-xs text-muted-foreground">{item.created_at || 'Waktu tidak tersedia'}</span>
                                </span>
                                <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
                        <Bell className="mb-3 size-9 text-muted-foreground" aria-hidden="true" />
                        <h2 className="font-semibold">Belum ada notifikasi</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Notifikasi booking dan informasi akun akan muncul di sini.</p>
                    </div>
                )}

                {notifications.links?.length > 3 && (
                    <nav className="flex flex-wrap items-center justify-center gap-2 pt-2" aria-label="Halaman notifikasi">
                        {notifications.links.map((link: any, index: number) => link.url ? (
                            <Link key={index} href={link.url} className={'rounded-md border px-3 py-2 text-sm ' + (link.active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted')} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ) : (
                            <span key={index} className="rounded-md border px-3 py-2 text-sm text-muted-foreground opacity-60" dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </nav>
                )}
            </section>
        </UserShell>
    );
}
