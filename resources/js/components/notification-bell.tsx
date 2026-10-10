import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    url: string;
    created_at?: string | null;
    read_at?: string | null;
};

export function NotificationBell({ className = '' }: { className?: string }) {
    const { notifications } = usePage().props as any;
    const latest: NotificationItem[] = notifications?.latest ?? [];
    const unreadCount: number = notifications?.unread_count ?? 0;
    const [open, setOpen] = useState(false);

    const visitNotification = (item: NotificationItem) => {
        if (!item.read_at) {
            router.post('/notifications/' + encodeURIComponent(item.id) + '/read', {}, {
                preserveScroll: true,
                onSuccess: () => router.visit(item.url || '/dashboard'),
            });
        } else {
            router.visit(item.url || '/dashboard');
        }
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={'relative shrink-0 ' + className}
                    aria-label={unreadCount ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'}
                    onMouseEnter={() => setOpen(true)}
                    onFocus={() => setOpen(true)}
                >
                    <Bell className="size-5" aria-hidden="true" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-background">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-[min(360px,calc(100vw-24px))] border border-border bg-background p-0 opacity-100 shadow-xl backdrop-blur-none"
                onMouseLeave={() => setOpen(false)}
            >
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold">Notifikasi</p>
                        <p className="text-xs text-muted-foreground">{unreadCount} belum dibaca</p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 px-2 text-xs"
                            onClick={() => router.post('/notifications/read-all', {}, { preserveScroll: true })}
                        >
                            <CheckCheck className="size-3.5" /> Tandai dibaca
                        </Button>
                    )}
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                    {latest.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>
                    ) : latest.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            onClick={() => visitNotification(item)}
                            className={'flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted ' + (!item.read_at ? 'bg-primary/5' : '')}
                        >
                            <span className={'mt-1 size-2 shrink-0 rounded-full ' + (!item.read_at ? 'bg-red-600' : 'bg-transparent')} />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">{item.title}</span>
                                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.message}</span>
                                <span className="mt-1 block text-[11px] text-muted-foreground">{item.created_at || ''}</span>
                            </span>
                        </button>
                    ))}
                </div>
                <div className="border-t px-4 py-2">
                    <Link href="/notifications" className="text-xs font-medium text-primary hover:underline" onClick={() => setOpen(false)}>
                        Lihat semua notifikasi
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
