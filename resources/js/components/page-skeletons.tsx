import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export function usePageLoading() {
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const start = router.on('start', () => setLoading(true));
        const finish = router.on('finish', () => setLoading(false));
        return () => {
            start();
            finish();
        };
    }, []);
    return loading;
}

function Block({ className = '' }: { className?: string }) {
    return <span className={`skeleton-block ${className}`} aria-hidden="true" />;
}

function PublicFrame({ children }: { children: ReactNode }) {
    return <div className="page-skeleton public-page-skeleton" aria-label="Memuat halaman">{children}</div>;
}

function AdminFrame({ children }: { children: ReactNode }) {
    return <div className="page-skeleton admin-page-skeleton" aria-label="Memuat halaman"><aside><Block className="sk-logo" />{[1,2,3,4,5].map(i => <Block key={i} className="sk-menu" />)}</aside><main><Block className="sk-admin-title" />{children}</main></div>;
}

const Cards = ({ count = 4, tall = false }: { count?: number; tall?: boolean }) => <div className="sk-card-grid">{Array.from({ length: count }, (_, i) => <div className={`sk-card ${tall ? 'tall' : ''}`} key={i}><Block className="sk-image" /><Block className="sk-line wide" /><Block className="sk-line" /></div>)}</div>;

export function HomeSkeleton() { return <PublicFrame><section className="sk-home-hero"><div><Block className="sk-pill" /><Block className="sk-heading jumbo" /><Block className="sk-heading" /><Block className="sk-search" /></div><Block className="sk-hero-image" /></section><section><Block className="sk-heading" /><Cards count={6} /></section><section><Block className="sk-heading" /><Cards count={4} tall /></section></PublicFrame>; }
export function FacilitiesSkeleton() { return <PublicFrame><Block className="sk-listing-hero" /><section><Block className="sk-filters" /><Cards count={6} tall /></section></PublicFrame>; }
export function FacilitySkeleton() { return <PublicFrame><section><Block className="sk-breadcrumb" /><div className="sk-detail-hero"><Block className="sk-hero-image" /><div><Block className="sk-heading" /><Block className="sk-copy" /><Block className="sk-button" /></div></div></section><section><Block className="sk-heading" /><Cards count={3} /></section></PublicFrame>; }
export function SportsSkeleton() { return <PublicFrame><Block className="sk-listing-hero" /><section><Block className="sk-heading" /><div className="sk-sport-list"><Cards count={6} /></div></section></PublicFrame>; }
export function SportSkeleton() { return <PublicFrame><section><Block className="sk-breadcrumb" /><div className="sk-detail-hero"><Block className="sk-hero-image" /><div><Block className="sk-heading" /><Block className="sk-copy" /></div></div></section><section><Block className="sk-heading" /><Cards count={3} tall /></section></PublicFrame>; }
export function EventsSkeleton() { return <PublicFrame><Block className="sk-listing-hero" /><section><Block className="sk-filters" /><Cards count={6} tall /></section></PublicFrame>; }
export function EventSkeleton() { return <PublicFrame><section><Block className="sk-breadcrumb" /><Block className="sk-event-banner" /><div className="sk-event-meta"><Block /><Block /><Block /></div><Block className="sk-copy" /></section></PublicFrame>; }
export function BlogIndexSkeleton() { return <PublicFrame><Block className="sk-listing-hero" /><section><Block className="sk-filter-tabs" /><Cards count={6} tall /></section></PublicFrame>; }
export function BlogShowSkeleton() { return <PublicFrame><article className="sk-article"><Block className="sk-breadcrumb" /><Block className="sk-heading jumbo" /><Block className="sk-line wide" /><Block className="sk-article-image" /><Block className="sk-copy tall" /></article></PublicFrame>; }
export function AdminDashboardSkeleton() { return <AdminFrame><div className="sk-stat-grid">{Array.from({length: 6}, (_, i) => <Block key={i} className="sk-stat" />)}</div><div className="sk-admin-columns"><Block className="sk-panel tall" /><Block className="sk-panel tall" /></div></AdminFrame>; }
export function AdminContentSkeleton() { return <AdminFrame><Block className="sk-filter-tabs" /><Block className="sk-panel-heading" />{Array.from({length: 6}, (_, i) => <Block key={i} className="sk-admin-row" />)}</AdminFrame>; }
export function AdminPagesSkeleton() { return <AdminFrame><Block className="sk-panel-heading" />{Array.from({length: 4}, (_, i) => <Block key={i} className="sk-admin-row" />)}<div className="sk-admin-columns"><Block className="sk-form-panel" /><Block className="sk-form-panel" /></div></AdminFrame>; }
export function AdminAccountSkeleton() { return <AdminFrame><div className="sk-admin-columns"><Block className="sk-form-panel" /><Block className="sk-form-panel" /></div></AdminFrame>; }
export function AdminBlogEditorSkeleton() { return <AdminFrame><div className="sk-admin-columns"><Block className="sk-editor" /><Block className="sk-form-panel" /></div></AdminFrame>; }
export function AdminReviewListSkeleton() { return <AdminFrame><div className="sk-stat-grid">{Array.from({length: 4}, (_, i) => <Block key={i} className="sk-stat" />)}</div><Block className="sk-filters" /><div className="sk-admin-columns"><Block className="sk-panel tall" /><Block className="sk-panel tall" /></div></AdminFrame>; }
export function AdminReviewEditorSkeleton() { return <AdminFrame><Block className="sk-editor" /></AdminFrame>; }
