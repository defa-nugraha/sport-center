import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { CmsModal, CmsSelect, ConfirmDialog, StatusDialog } from '@/components/admin-cms';
import { AdminPagesSkeleton, usePageLoading } from '@/components/page-skeletons';
import { asset } from '@/components/public-site';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Activity, Building2, CalendarDays, Clock, Dumbbell, LockKeyhole, MapPin, Pencil, Plus, Trash2, Trophy, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

const iconOptions: Record<string, any> = { activity: Activity, building: Building2, calendar: CalendarDays, clock: Clock, dumbbell: Dumbbell, 'map-pin': MapPin, trophy: Trophy, users: Users };
const pageLabels: Record<string, string> = { home: 'Beranda', facilities: 'Daftar fasilitas', 'facility-detail': 'Detail fasilitas', sports: 'Daftar olahraga', 'sport-detail': 'Detail olahraga', events: 'Daftar acara', 'event-detail': 'Detail acara', blog: 'Daftar kabar', 'blog-detail': 'Detail kabar' };

function ListPagination({ page, total, perPage, onChange, label }: any) {
    const pages = Math.ceil(total / perPage);
    if (pages <= 1) return null;
    return <nav className="pagination" aria-label={`Pagination ${label}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 16 }}><small>Halaman {page} dari {pages} · {total} data</small><div style={{ display: 'flex', gap: 6 }}><button type="button" className="button small" disabled={page <= 1} onClick={() => onChange(page - 1)}>Sebelumnya</button><button type="button" className="button small" disabled={page >= pages} onClick={() => onChange(page + 1)}>Berikutnya</button></div></nav>;
}

export default function AdminPages({
    pageSection = 'sections',
    sectionLabel = 'Teks Setiap Bagian',
    pageSections = [],
    pageBanners = [],
    homepageHighlights = [],
    partnerLogos = [],
    settings = {},
}: any) {
    const loading = usePageLoading();
    const { flash } = usePage().props as any;
    const [mode, setMode] = useState<'section' | 'banner' | 'highlight' | 'logo' | null>(null);
    const [editing, setEditing] = useState<any>(null);
    const [iconOpen, setIconOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [status, setStatus] = useState<any>(null);
    const [listPages, setListPages] = useState<Record<string, number>>({});
    const pageSize = 8;
    const pageItems = (key: string, items: any[]) => items.slice(((listPages[key] || 1) - 1) * pageSize, (listPages[key] || 1) * pageSize);
    const listPager = (key: string, items: any[]) => <ListPagination label={key} page={listPages[key] || 1} total={items.length} perPage={pageSize} onChange={(next: number) => setListPages(current => ({ ...current, [key]: next }))} />;
    const section = useForm({ page: 'home', section_key: '', eyebrow: '', title: '', title_accent: '', description: '', button_label: '', button_url: '', enabled: true, sort_order: 0 });
    const banner = useForm({ page: 'home', title: '', image: null as File | null, alt_text: '', location_label: 'Majalengka, Jawa Barat', url: '', published: true, sort_order: 0 });
    const highlight = useForm({ icon: 'activity', title: '', description: '', published: true, sort_order: 0 });
    const logo = useForm({ name: '', image: null as File | null, url: '', alt_text: '', published: true, sort_order: 0 });
    const global = useForm({ site_name: settings.site_name || '', tagline: settings.tagline || '', address: settings.address || '', phone: settings.phone || '', whatsapp: settings.whatsapp || '', email: settings.email || '', instagram: settings.instagram || '', facebook: settings.facebook || '', youtube: settings.youtube || '', tiktok: settings.tiktok || '' });

    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);
    useEffect(() => {
        if (pageSection === 'settings') {
            global.setData({ site_name: settings.site_name || '', tagline: settings.tagline || '', address: settings.address || '', phone: settings.phone || '', whatsapp: settings.whatsapp || '', email: settings.email || '', instagram: settings.instagram || '', facebook: settings.facebook || '', youtube: settings.youtube || '', tiktok: settings.tiktok || '' });
        }
    }, [pageSection, settings]);
    const form: any = mode === 'section' ? section : mode === 'banner' ? banner : mode === 'highlight' ? highlight : logo;
    const fail = (errors: Record<string, string>) => setStatus({ type: 'error', message: Object.values(errors)[0] || 'Periksa kembali data yang dimasukkan.' });
    const open = (kind: typeof mode, item?: any) => {
        setMode(kind); setEditing(item || null);
        if (kind === 'section') section.setData({ page: item?.page || 'home', section_key: item?.section_key || '', eyebrow: item?.eyebrow || '', title: item?.title || '', title_accent: item?.title_accent || '', description: item?.description || '', button_label: item?.button_label || '', button_url: item?.button_url || '', enabled: item ? Boolean(item.enabled) : true, sort_order: item?.sort_order || 0 });
        if (kind === 'banner') banner.setData({ page: 'home', title: item?.title || '', image: null, alt_text: item?.alt_text || '', location_label: item?.location_label || 'Majalengka, Jawa Barat', url: item?.url || '', published: item ? Boolean(item.published) : true, sort_order: item?.sort_order || 0 });
        if (kind === 'highlight') highlight.setData({ icon: item?.icon || 'activity', title: item?.title || '', description: item?.description || '', published: item ? Boolean(item.published) : true, sort_order: item?.sort_order || 0 });
        if (kind === 'logo') logo.setData({ name: item?.name || '', image: null, url: item?.url || '', alt_text: item?.alt_text || '', published: item ? Boolean(item.published) : true, sort_order: item?.sort_order || 0 });
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const segment = mode === 'section' ? 'page-sections' : mode === 'banner' ? 'page-banners' : mode === 'highlight' ? 'homepage-highlights' : 'partner-logos';
        if (editing) form.transform((data: any) => ({ ...data, _method: 'put' }));
        form.post(`/admin/${segment}${editing ? `/${editing.encrypted_id}` : ''}`, {
            forceFormData: mode === 'logo' || mode === 'banner',
            preserveScroll: true,
            onSuccess: () => {
                setStatus({ type: 'success', message: editing ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.' });
                setMode(null);
                setEditing(null);
                form.reset();
            },
            onError: fail,
        });
    };
    const remove = () => {
        if (!deleteTarget) return;
        router.delete(deleteTarget.url, {
            preserveScroll: true,
            onSuccess: () => {
                setStatus({ type: 'success', message: 'Data berhasil dihapus.' });
                setDeleteTarget(null);
            },
            onError: fail,
        });
    };
    const submitGlobal = (event: FormEvent) => {
        event.preventDefault();
        global.post('/admin/settings', {
            preserveScroll: true,
            onSuccess: () => setStatus({ type: 'success', message: 'Identitas situs berhasil diperbarui.' }),
            onError: fail,
        });
    };
    if (loading) return <AdminPagesSkeleton />;

    return <div className="admin-shell">
        <Head title={sectionLabel} />
        <AdminSidebar active="pages" pageSection={pageSection} />
        <main className="admin-main">
            <AdminTopbar title={sectionLabel} description="Kelola elemen tampilan halaman publik dari bagian ini." />
            {pageSection === 'sections' && <section className="admin-panel">
                <div className="panel-head"><div><h2>Teks setiap bagian</h2><p>Judul, deskripsi, dan tombol pada halaman publik.</p></div><button className="button" onClick={() => open('section')}><Plus /> Tambah bagian</button></div>
                {pageSections.length === 0 && <div className="empty-state"><h3>Belum ada bagian halaman</h3><p>Tambahkan bagian pertama untuk mengatur teks halaman ini.</p></div>}
                {pageItems('pageSections', pageSections).map((item: any) => <div className="admin-row" key={item.encrypted_id}><div><strong>{item.title}</strong><small>{pageLabels[item.page]} · {item.section_key}</small></div><span className="admin-row-actions"><button className="icon-button" onClick={() => open('section', item)} aria-label={`Ubah ${item.title}`}><Pencil /></button><button className="icon-button danger" onClick={() => setDeleteTarget({ url: `/admin/page-sections/${item.encrypted_id}`, name: item.title })} aria-label={`Hapus ${item.title}`}><Trash2 /></button></span></div>)}
                {listPager('pageSections', pageSections)}
            </section>}
            {pageSection === 'banners' && <section className="admin-panel"><div className="panel-head"><div><h2>Banner Beranda</h2><p>Gambar yang berganti otomatis pada area utama Beranda.</p></div><button className="button" onClick={() => open('banner')}><Plus /> Tambah banner</button></div>{pageBanners.length === 0 && <div className="empty-state"><h3>Belum ada banner</h3><p>Tambahkan gambar pertama untuk slider Beranda.</p></div>}{pageItems('pageBanners', pageBanners).map((item: any) => <div className="admin-row admin-row-media" key={item.encrypted_id}><img src={asset(item.image)} alt={item.alt_text || item.title} /><div><strong>{item.title}</strong><small>{item.published ? 'Ditampilkan' : 'Disembunyikan'} · Urutan {item.sort_order}</small></div><span className="admin-row-actions"><button className="icon-button" onClick={() => open('banner', item)} aria-label={`Ubah ${item.title}`}><Pencil /></button><button className="icon-button danger" onClick={() => setDeleteTarget({ url: `/admin/page-banners/${item.encrypted_id}`, name: item.title })} aria-label={`Hapus ${item.title}`}><Trash2 /></button></span></div>)}{listPager('pageBanners', pageBanners)}</section>}
            {pageSection === 'highlights' && <section className="admin-panel"><div className="panel-head"><div><h2>Keunggulan beranda</h2><p>Ikon dan manfaat di bawah pencarian.</p></div><button className="icon-button" onClick={() => open('highlight')}><Plus /></button></div>{pageItems('homepageHighlights', homepageHighlights).map((item: any) => { const Icon = iconOptions[item.icon] || Activity; return <div className="admin-row" key={item.encrypted_id}><Icon /><div><strong>{item.title}</strong><small>{item.description}</small></div><span className="admin-row-actions"><button className="icon-button" onClick={() => open('highlight', item)}><Pencil /></button><button className="icon-button danger" onClick={() => setDeleteTarget({ url: `/admin/homepage-highlights/${item.encrypted_id}`, name: item.title })}><Trash2 /></button></span></div>; })}{listPager('homepageHighlights', homepageHighlights)}</section>}
            {pageSection === 'partners' && <section className="admin-panel"><div className="panel-head"><div><h2>Logo jejak kebersamaan</h2><p>Mitra yang bergerak pada marquee beranda. Logo UNMA adalah logo bawaan dan tidak dapat diubah atau dihapus.</p></div><button className="icon-button" onClick={() => open('logo')}><Plus /></button></div><div className="admin-row admin-row-media"><img src="/assets/ilustrasi/logo-unma.svg" alt="Universitas Majalengka (UNMA)" /><div><strong>Universitas Majalengka (UNMA)</strong><small>Logo bawaan · Selalu ditampilkan di halaman publik</small></div><span className="admin-row-actions" aria-label="Logo bawaan terkunci"><LockKeyhole aria-hidden="true" /><small>Terkunci</small></span></div>{pageItems('partnerLogos', partnerLogos.filter((item: any) => !/\b(unma|universitas majalengka)\b/i.test(`${item.name || ''} ${item.alt_text || ''} ${item.image || ''}`))).map((item: any) => <div className="admin-row admin-row-media" key={item.encrypted_id}><img src={asset(item.image)} alt="" /><div><strong>{item.name}</strong><small>{item.alt_text}</small></div><span className="admin-row-actions"><button className="icon-button" onClick={() => open('logo', item)} aria-label={`Ubah ${item.name}`}><Pencil /></button><button className="icon-button danger" onClick={() => setDeleteTarget({ url: `/admin/partner-logos/${item.encrypted_id}`, name: item.name })} aria-label={`Hapus ${item.name}`}><Trash2 /></button></span></div>)}{listPager('partnerLogos', partnerLogos.filter((item: any) => !/\b(unma|universitas majalengka)\b/i.test(`${item.name || ''} ${item.alt_text || ''} ${item.image || ''}`)))}</section>}
            {pageSection === 'settings' && <section className="admin-panel">
                <div className="panel-head"><div><h2>Identitas & footer</h2><p>Informasi global yang dipakai pada header, footer, kontak, dan tombol reservasi.</p></div></div>
                <form className="cms-form" onSubmit={submitGlobal}>
                    <div className="two-col"><label>Nama situs *<input required value={global.data.site_name} onChange={(e)=>global.setData('site_name',e.target.value)}/></label><label>Tagline<input value={global.data.tagline} onChange={(e)=>global.setData('tagline',e.target.value)}/></label></div>
                    <label>Alamat<input value={global.data.address} onChange={(e)=>global.setData('address',e.target.value)}/></label>
                    <div className="two-col"><label>Telepon<input value={global.data.phone} onChange={(e)=>global.setData('phone',e.target.value)}/></label><label>WhatsApp<input value={global.data.whatsapp} onChange={(e)=>global.setData('whatsapp',e.target.value)}/></label></div>
                    <div className="two-col"><label>Email<input type="email" value={global.data.email} onChange={(e)=>global.setData('email',e.target.value)}/></label><label>Instagram<input type="url" value={global.data.instagram} onChange={(e)=>global.setData('instagram',e.target.value)}/></label></div>
                    <div className="two-col"><label>Facebook<input type="url" value={global.data.facebook} onChange={(e)=>global.setData('facebook',e.target.value)}/></label><label>YouTube<input type="url" value={global.data.youtube} onChange={(e)=>global.setData('youtube',e.target.value)}/></label></div>
                    <label>TikTok<input type="url" value={global.data.tiktok} onChange={(e)=>global.setData('tiktok',e.target.value)}/></label>
                    <button className="button" disabled={global.processing}>Simpan identitas situs</button>
                </form>
            </section>}
        </main>
        <CmsModal open={mode === 'section'} onOpenChange={(v) => !v && setMode(null)} title={editing ? 'Edit bagian halaman' : 'Tambah bagian halaman'} size="lg"><form className="cms-form modal-form" onSubmit={submit}><div className="two-col"><label>Halaman *<CmsSelect value={section.data.page} onValueChange={(value) => section.setData('page', value)} options={Object.entries(pageLabels).map(([value, label]) => ({ value, label }))} /></label><label>Kunci bagian *<input required value={section.data.section_key} onChange={(e) => section.setData('section_key', e.target.value)} placeholder="contoh: hero" /></label></div><label>Label kecil<input value={section.data.eyebrow} onChange={(e) => section.setData('eyebrow', e.target.value)} /></label><div className="two-col"><label>Judul *<input required value={section.data.title} onChange={(e) => section.setData('title', e.target.value)} /></label><label>Aksen judul<input value={section.data.title_accent} onChange={(e) => section.setData('title_accent', e.target.value)} /></label></div><label>Deskripsi<textarea value={section.data.description} onChange={(e) => section.setData('description', e.target.value)} /></label><div className="two-col"><label>Teks tombol<input value={section.data.button_label} onChange={(e) => section.setData('button_label', e.target.value)} /></label><label>Tujuan tombol<input value={section.data.button_url} onChange={(e) => section.setData('button_url', e.target.value)} /></label></div><label className="toggle-label"><input type="checkbox" checked={section.data.enabled} onChange={(e) => section.setData('enabled', e.target.checked)} />Tampilkan bagian</label><button className="button" disabled={section.processing}>Simpan bagian</button></form></CmsModal>
        <CmsModal open={mode === 'banner'} onOpenChange={(v) => !v && setMode(null)} title={editing ? 'Edit banner' : 'Tambah banner'} description="Gunakan gambar lanskap agar hasilnya tetap baik di desktop dan mobile." size="md"><form className="cms-form modal-form" onSubmit={submit}>{editing?.image && <img className="cms-banner-preview" src={asset(editing.image)} alt={editing.title} />}<label>Judul banner *<input required value={banner.data.title} onChange={(e) => banner.setData('title', e.target.value)} /></label><label>Gambar {!editing && '*'}<input type="file" accept="image/jpeg,image/png,image/webp" required={!editing} onChange={(e) => banner.setData('image', e.target.files?.[0] || null)} /></label><label>Teks alternatif<input value={banner.data.alt_text} onChange={(e) => banner.setData('alt_text', e.target.value)} placeholder="Jelaskan isi gambar secara singkat" /></label><div className="two-col"><label>Label lokasi<input value={banner.data.location_label} onChange={(e) => banner.setData('location_label', e.target.value)} /></label><label>Urutan<input type="number" min="0" value={banner.data.sort_order} onChange={(e) => banner.setData('sort_order', Number(e.target.value))} /></label></div><label>Tujuan saat gambar diklik<input value={banner.data.url} onChange={(e) => banner.setData('url', e.target.value)} placeholder="/facilities atau https://..." /></label><label className="toggle-label"><input type="checkbox" checked={banner.data.published} onChange={(e) => banner.setData('published', e.target.checked)} />Tampilkan banner</label><button className="button" disabled={banner.processing}>Simpan banner</button></form></CmsModal>
        <CmsModal open={mode === 'highlight'} onOpenChange={(v) => !v && setMode(null)} title={editing ? 'Edit keunggulan' : 'Tambah keunggulan'} size="sm"><form className="cms-form modal-form" onSubmit={submit}><label>Ikon<button type="button" className="icon-picker-trigger" onClick={() => setIconOpen(true)}>{(() => { const Icon = iconOptions[highlight.data.icon] || Activity; return <Icon />; })()}<span>Pilih ikon</span></button></label><label>Judul *<input required value={highlight.data.title} onChange={(e) => highlight.setData('title', e.target.value)} /></label><label>Deskripsi<input value={highlight.data.description} onChange={(e) => highlight.setData('description', e.target.value)} /></label><button className="button" disabled={highlight.processing}>Simpan keunggulan</button></form></CmsModal>
        <CmsModal open={iconOpen} onOpenChange={setIconOpen} title="Pilih ikon" size="sm"><div className="icon-picker-grid">{Object.entries(iconOptions).map(([name, Icon]) => <button type="button" key={name} onClick={() => { highlight.setData('icon', name); setIconOpen(false); }} className={highlight.data.icon === name ? 'active' : ''}><Icon /><span>{name}</span></button>)}</div></CmsModal>
        <CmsModal open={mode === 'logo'} onOpenChange={(v) => !v && setMode(null)} title={editing ? 'Edit logo mitra' : 'Tambah logo mitra'} size="sm"><form className="cms-form modal-form" onSubmit={submit}><label>Nama *<input required value={logo.data.name} onChange={(e) => logo.setData('name', e.target.value)} /></label>{editing?.image && <img className="cms-image-preview" src={asset(editing.image)} alt={editing.name} />}<label>File logo {!editing && '*'}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required={!editing} onChange={(e) => logo.setData('image', e.target.files?.[0] || null)} /></label><label>Teks alternatif<input value={logo.data.alt_text} onChange={(e) => logo.setData('alt_text', e.target.value)} /></label><label>Tautan<input type="url" value={logo.data.url} onChange={(e) => logo.setData('url', e.target.value)} /></label><button className="button" disabled={logo.processing}>Simpan logo</button></form></CmsModal>
        <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)} itemName={deleteTarget?.name} onConfirm={remove} />
        <StatusDialog open={Boolean(status)} onOpenChange={(v) => !v && setStatus(null)} type={status?.type || 'success'} message={status?.message || ''} />
    </div>;
}
