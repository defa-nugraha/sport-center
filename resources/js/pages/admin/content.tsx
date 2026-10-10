import {
    AdminSidebar,
    AdminTopbar,
} from '@/components/admin-layout';
import {
    CmsModal,
    CmsSelect,
    ConfirmDialog,
    StatusDialog,
} from '@/components/admin-cms';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { RichTextEditor } from '@/components/rich-text-editor';
import { asset } from '@/components/public-site';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminContentSkeleton, usePageLoading } from '@/components/page-skeletons';

const initialSport = {
    name: '',
    description: '',
    surface: '',
    court_type: '',
    sport_category_id: '',
    images: [] as File[],
    primary_image: 0,
    published: true,
};
const initialEvent = {
    title: '',
    description: '',
    sport_id: '',
    facility_id: '',
    starts_at: '',
    ends_at: '',
    status: 'upcoming',
    reminder_enabled: true,
    reminder_days_before: 1,
    images: [] as File[],
    primary_image: 0,
    published: true,
};
type DeleteTarget = { url: string; name: string } | null;

function Submit({
    processing,
    editing,
}: {
    processing: boolean;
    editing: boolean;
}) {
    return (
        <div className="cms-submit">
            <button className="button" disabled={processing}>
                {processing
                    ? 'Menyimpan...'
                    : editing
                      ? 'Simpan perubahan'
                      : 'Simpan data'}
            </button>
        </div>
    );
}
function ListPagination({ page, total, perPage, onChange, label }: any) {
    const pages = Math.ceil(total / perPage);
    if (pages <= 1) return null;
    return <nav aria-label={`Pagination ${label}`} className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
        <small>Halaman {page} dari {pages} · {total} data</small>
        <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="button small" disabled={page <= 1} onClick={() => onChange(page - 1)}>Sebelumnya</button>
            <button type="button" className="button small" disabled={page >= pages} onClick={() => onChange(page + 1)}>Berikutnya</button>
        </div>
    </nav>;
}

function ContentRow({ image, title, meta, onEdit, onDelete }: any) {
    return (
        <div className="admin-row admin-row-media">
            {image && <img src={asset(image)} alt="" />}
            <div>
                <strong>{title}</strong>
                {meta && <small>{meta}</small>}
            </div>
            <span className="admin-row-actions">
                <button
                    className="icon-button"
                    type="button"
                    onClick={onEdit}
                    aria-label={`Ubah ${title}`}
                >
                    <Pencil />
                </button>
                <button
                    className="icon-button danger"
                    type="button"
                    onClick={onDelete}
                    aria-label={`Hapus ${title}`}
                >
                    <Trash2 />
                </button>
            </span>
        </div>
    );
}

export default function Content({
    facilities,
    sports,
    events,
    regions,
    categories,
    blogPosts,
    blogCategories,
    blogTags,
}: any) {
    const loading = usePageLoading();
    const page = usePage();
    const { flash, auth } = page.props as any;
    const permissions: string[] = auth?.permissions || [];
    const allowedTabs = [
        ['facilities', 'Fasilitas', 'kelola fasilitas'],
        ['sports', 'Olahraga', 'kelola olahraga'],
        ['events', 'Acara', 'kelola acara'],
        ['blog', 'Kabar & Artikel', 'kelola artikel'],
    ].filter(([, , permission]) => permissions.includes(permission));
    const requestedTab = new URLSearchParams(
        page.url.split('?')[1] || '',
    ).get('tab');
    const [tab, setTab] = useState(
        allowedTabs.some(([key]) => key === requestedTab)
            ? requestedTab!
            : allowedTabs[0]?.[0] || 'blog',
    );
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [deleting, setDeleting] = useState(false);
    const [status, setStatus] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [listPages, setListPages] = useState<Record<string, number>>({});
    const pageSize = 8;
    const pageItems = (key: string, items: any[]) => items.slice(((listPages[key] || 1) - 1) * pageSize, (listPages[key] || 1) * pageSize);
    const listPager = (key: string, items: any[]) => <ListPagination label={key} page={listPages[key] || 1} total={items.length} perPage={pageSize} onChange={(next: number) => setListPages(current => ({ ...current, [key]: next }))} />;
    const [taxonomy, setTaxonomy] = useState<'category' | 'tag' | null>(null);
    const [editingTaxonomy, setEditingTaxonomy] = useState<any>(null);
    const sport = useForm(initialSport);
    const event = useForm(initialEvent);
    const category = useForm({ name: '', description: '' });
    const tag = useForm({ name: '' });
    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);
    const opts = useMemo(
        () => ({
            regions: regions.map((x: any) => ({
                value: String(x.id),
                label: x.name,
            })),
            sports: sports.map((x: any) => ({
                value: String(x.id),
                label: x.name,
            })),
            facilities: facilities.map((x: any) => ({
                value: String(x.id),
                label: x.name,
            })),
            categories: categories.map((x: any) => ({
                value: String(x.id),
                label: x.name,
            })),
        }),
        [regions, sports, facilities, categories],
    );
    const fail = (errors: Record<string, string>) =>
        setStatus({
            type: 'error',
            message:
                Object.values(errors)[0] ||
                'Periksa kembali data yang Anda masukkan.',
        });
    const currentForm: any = tab === 'sports' ? sport : event;
    const openCreate = () => {
        if (tab === 'facilities') {
            router.visit('/admin/facilities/create');
            return;
        }
        setEditing(null);
        currentForm.transform((data: any) => data);
        currentForm.reset();
        setModalOpen(true);
    };
    const openEdit = (item: any) => {
        if (tab === 'facilities') {
            router.visit(`/admin/facilities/${item.encrypted_id}/edit`);
            return;
        }
        setEditing(item);
        currentForm.transform((data: any) => data);
        if (tab === 'sports')
            sport.setData({
                ...initialSport,
                name: item.name || '',
                description: item.description || '',
                surface: item.surface || '',
                court_type: item.court_type || '',
                sport_category_id: item.sport_category_id
                    ? String(item.sport_category_id)
                    : '',
                published: Boolean(item.published),
            });
        if (tab === 'events')
            event.setData({
                ...initialEvent,
                title: item.title || '',
                description: item.description || '',
                sport_id: item.sport_id ? String(item.sport_id) : '',
                facility_id: item.facility_id ? String(item.facility_id) : '',
                starts_at: item.starts_at?.slice(0, 16) || '',
                ends_at: item.ends_at?.slice(0, 16) || '',
                status: item.status || 'upcoming',
                reminder_enabled: Boolean(item.reminder_enabled),
                reminder_days_before: Number(item.reminder_days_before ?? 1),
                published: Boolean(item.published),
            });
        setModalOpen(true);
    };
    const submitEntity = (e: FormEvent) => {
        e.preventDefault();
        const segment = tab === 'sports' ? 'sports' : 'events';
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setStatus({ type: 'success', message: editing ? 'Data berhasil diperbarui.' : 'Data berhasil ditambahkan.' });
                setEditing(null);
                currentForm.reset();
            },
            onError: fail,
        };
        if (editing) {
            currentForm.transform((data: any) => ({ ...data, _method: 'put' }));
            currentForm.post(`/admin/${segment}/${editing.encrypted_id}`, options);
        } else currentForm.post(`/admin/${segment}`, options);
    };
    const remove = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(deleteTarget.url, {
            preserveScroll: true,
            onSuccess: () => {
                setStatus({ type: 'success', message: 'Data berhasil dihapus.' });
                setDeleteTarget(null);
            },
            onError: fail,
            onFinish: () => setDeleting(false),
        });
    };
    const openTaxonomy = (kind: 'category' | 'tag', item?: any) => {
        setTaxonomy(kind);
        setEditingTaxonomy(item || null);
        const form: any = kind === 'category' ? category : tag;
        form.transform((data: any) => data);
        form.setData(
            kind === 'category'
                ? {
                      name: item?.name || '',
                      description: item?.description || '',
                  }
                : { name: item?.name || '' },
        );
    };
    const submitTaxonomy = (e: FormEvent) => {
        e.preventDefault();
        const form: any = taxonomy === 'category' ? category : tag;
        const plural = taxonomy === 'category' ? 'categories' : 'tags';
        const url = editingTaxonomy
            ? `/admin/blog/${plural}/${editingTaxonomy.encrypted_id}`
            : `/admin/blog/${plural}`;
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setStatus({ type: 'success', message: editingTaxonomy ? 'Taksonomi berhasil diperbarui.' : 'Taksonomi berhasil ditambahkan.' });
                setTaxonomy(null);
                form.reset();
            },
            onError: fail,
        };
        if (editingTaxonomy) {
            form.transform((data: any) => ({ ...data, _method: 'put' }));
            form.post(url, options);
        } else form.post(url, options);
    };
    const changeTab = (next: string) => {
        setTab(next);
        setModalOpen(false);
        setEditing(null);
    };
    const requestImageDelete = (image: { id?: number; encrypted_id?: string }) => {
        if (!editing || !image.id) return;
        const segment = tab === 'sports' ? 'sports' : 'events';
        setDeleteTarget({
            url: `/admin/${segment}/${editing.encrypted_id}/images/${image.encrypted_id}`,
            name: `Gambar ${editing.name || editing.title}`,
        });
    };

    if (loading) return <AdminContentSkeleton />;
    return (
        <div className="admin-shell">
            <Head title="Kelola konten" />
            <AdminSidebar active="content" contentSection={tab} />
            <main className="admin-main">
                <AdminTopbar
                    title="Kelola Konten"
                    description="Atur informasi yang tampil di situs GGM Majalengka."
                />
                <div className="tabs">
                    {allowedTabs.map(([key, label]) => (
                        <button
                            key={key}
                            className={tab === key ? 'active' : ''}
                            onClick={() => changeTab(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {tab === 'facilities' && (
                    <section className="admin-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Daftar fasilitas</h2>
                                <p>
                                    Tempat olahraga yang tersedia untuk
                                    pengunjung.
                                </p>
                            </div>
                            <Link className="button" href="/admin/facilities/create">
                                <Plus /> Tambah fasilitas
                            </Link>
                        </div>
                        {pageItems('facilities', facilities).map((x: any) => (
                            <ContentRow
                                key={x.id}
                                image={x.thumbnail || x.hero_image}
                                title={x.name}
                                meta={x.subtitle || x.venue_type}
                                onEdit={() => router.visit(`/admin/facilities/${x.encrypted_id}/edit`)}
                                onDelete={() =>
                                    setDeleteTarget({
                                        url: `/admin/facilities/${x.encrypted_id}`,
                                        name: x.name,
                                    })
                                }
                            />
                        ))}
                        {listPager('facilities', facilities)}
                    </section>
                )}
                {tab === 'sports' && (
                    <section className="admin-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Daftar olahraga</h2>
                                <p>
                                    Cabang olahraga dan jenis arena yang
                                    tersedia.
                                </p>
                            </div>
                            <button className="button" onClick={openCreate}>
                                <Plus /> Tambah olahraga
                            </button>
                        </div>
                        {pageItems('sports', sports).map((x: any) => (
                            <ContentRow
                                key={x.id}
                                image={x.image}
                                title={x.name}
                                meta={[x.court_type, x.surface]
                                    .filter(Boolean)
                                    .join(' · ')}
                                onEdit={() => openEdit(x)}
                                onDelete={() =>
                                    setDeleteTarget({
                                        url: `/admin/sports/${x.encrypted_id}`,
                                        name: x.name,
                                    })
                                }
                            />
                        ))}
                        {listPager('sports', sports)}
                    </section>
                )}
                {tab === 'events' && (
                    <section className="admin-panel">
                        <div className="panel-head">
                            <div>
                                <h2>Kalender acara</h2>
                                <p>
                                    Turnamen dan kegiatan olahraga yang
                                    dipublikasikan.
                                </p>
                            </div>
                            <button className="button" onClick={openCreate}>
                                <Plus /> Tambah acara
                            </button>
                        </div>
                        {pageItems('events', events).map((x: any) => (
                            <ContentRow
                                key={x.id}
                                image={x.image}
                                title={x.title}
                                meta={`${x.sport?.name || 'Umum'} · ${new Date(x.starts_at).toLocaleDateString('id-ID')}`}
                                onEdit={() => openEdit(x)}
                                onDelete={() =>
                                    setDeleteTarget({
                                        url: `/admin/events/${x.encrypted_id}`,
                                        name: x.title,
                                    })
                                }
                            />
                        ))}
                        {listPager('events', events)}
                    </section>
                )}
                {tab === 'blog' && (
                    <div className="blog-admin-grid">
                        <section className="admin-panel blog-post-panel">
                            <div className="panel-head">
                                <div>
                                    <h2>Kabar & artikel</h2>
                                    <p>Publikasikan kabar terbaru dari GGM.</p>
                                </div>
                                <Link
                                    className="button"
                                    href="/admin/blog/posts/create"
                                >
                                    <Plus /> Tulis artikel
                                </Link>
                            </div>
                            {blogPosts.length ? (
                                pageItems('blogPosts', blogPosts).map((x: any) => (
                                    <ContentRow
                                        key={x.id}
                                        image={x.featured_image}
                                        title={x.title}
                                        meta={`${x.category?.name || 'Tanpa kategori'} · ${x.status === 'published' ? 'Terbit' : 'Draf'}`}
                                        onEdit={() =>
                                            router.visit(
                                                `/admin/blog/posts/${x.encrypted_id}/edit`,
                                            )
                                        }
                                        onDelete={() =>
                                            setDeleteTarget({
                                                url: `/admin/blog/posts/${x.encrypted_id}`,
                                                name: x.title,
                                            })
                                        }
                                    />
                                ))
                            ) : (
                                <div className="admin-empty">
                                    <FileText />
                                    <strong>Belum ada artikel</strong>
                                    <span>
                                        Mulai bagikan kabar dari GGM Majalengka.
                                    </span>
                                </div>
                            )}
                            {listPager('blogPosts', blogPosts)}
                        </section>
                        {permissions.includes('kelola taksonomi artikel') && (
                            <>
                                <section className="admin-panel">
                                    <div className="panel-head">
                                        <h3>Kategori</h3>
                                        <button
                                            className="icon-button"
                                            onClick={() =>
                                                openTaxonomy('category')
                                            }
                                        >
                                            <Plus />
                                        </button>
                                    </div>
                                    {pageItems('blogCategories', blogCategories).map((x: any) => (
                                        <ContentRow
                                            key={x.id}
                                            title={x.name}
                                            meta={`${x.posts_count} artikel`}
                                            onEdit={() =>
                                                openTaxonomy('category', x)
                                            }
                                            onDelete={() =>
                                                setDeleteTarget({
                                                    url: `/admin/blog/categories/${x.encrypted_id}`,
                                                    name: x.name,
                                                })
                                            }
                                        />
                                    ))}
                                    {listPager('blogCategories', blogCategories)}
                                </section>
                                <section className="admin-panel">
                                    <div className="panel-head">
                                        <h3>Tag</h3>
                                        <button
                                            className="icon-button"
                                            onClick={() => openTaxonomy('tag')}
                                        >
                                            <Plus />
                                        </button>
                                    </div>
                                    {pageItems('blogTags', blogTags).map((x: any) => (
                                        <ContentRow
                                            key={x.id}
                                            title={x.name}
                                            meta={`${x.posts_count} artikel`}
                                            onEdit={() =>
                                                openTaxonomy('tag', x)
                                            }
                                            onDelete={() =>
                                                setDeleteTarget({
                                                    url: `/admin/blog/tags/${x.encrypted_id}`,
                                                    name: x.name,
                                                })
                                            }
                                        />
                                    ))}
                                    {listPager('blogTags', blogTags)}
                                </section>
                            </>
                        )}
                    </div>
                )}
            </main>
            <CmsModal
                open={modalOpen && tab === 'sports'}
                onOpenChange={setModalOpen}
                title={editing ? 'Edit olahraga' : 'Tambah olahraga'}
                description="Atur informasi olahraga dan galerinya."
                size="lg"
            >
                <form className="cms-form modal-form" onSubmit={submitEntity}>
                    <label>
                        Nama *
                        <input
                            required
                            value={sport.data.name}
                            onChange={(e) =>
                                sport.setData('name', e.target.value)
                            }
                        />
                    </label>
                    <label>
                        Deskripsi
                        <RichTextEditor
                            label="Deskripsi olahraga"
                            value={sport.data.description}
                            onChange={(value) =>
                                sport.setData('description', value)
                            }
                        />
                    </label>
                    <div className="two-col">
                        <label>
                            Permukaan
                            <input
                                value={sport.data.surface}
                                onChange={(e) =>
                                    sport.setData('surface', e.target.value)
                                }
                            />
                        </label>
                        <label>
                            Jenis lapangan
                            <input
                                value={sport.data.court_type}
                                onChange={(e) =>
                                    sport.setData('court_type', e.target.value)
                                }
                            />
                        </label>
                    </div>
                    <label>
                        Kategori
                        <CmsSelect
                            value={sport.data.sport_category_id}
                            onValueChange={(value) =>
                                sport.setData('sport_category_id', value)
                            }
                            options={opts.categories}
                            placeholder="Pilih kategori"
                        />
                    </label>
                    <MultiImageUpload
                        files={sport.data.images}
                        onChange={(files) => sport.setData('images', files)}
                        primary={sport.data.primary_image}
                        onPrimaryChange={(index) =>
                            sport.setData('primary_image', index)
                        }
                        existing={
                            editing?.galleries ||
                            (editing?.image ? [{ image: editing.image }] : [])
                        }
                        onDeleteExisting={requestImageDelete}
                    />
                    <Submit
                        processing={sport.processing}
                        editing={Boolean(editing)}
                    />
                </form>
            </CmsModal>
            <CmsModal
                open={modalOpen && tab === 'events'}
                onOpenChange={setModalOpen}
                title={editing ? 'Edit acara' : 'Tambah acara'}
                description="Atur jadwal, informasi, dan galeri acara."
                size="lg"
            >
                <form className="cms-form modal-form" onSubmit={submitEntity}>
                    <label>
                        Judul *
                        <input
                            required
                            value={event.data.title}
                            onChange={(e) =>
                                event.setData('title', e.target.value)
                            }
                        />
                    </label>
                    <label>
                        Deskripsi
                        <RichTextEditor
                            label="Deskripsi acara"
                            value={event.data.description}
                            onChange={(value) =>
                                event.setData('description', value)
                            }
                        />
                    </label>
                    <div className="two-col">
                        <label>
                            Olahraga
                            <CmsSelect
                                value={event.data.sport_id}
                                onValueChange={(value) =>
                                    event.setData('sport_id', value)
                                }
                                options={opts.sports}
                                placeholder="Pilih olahraga"
                            />
                        </label>
                        <label>
                            Fasilitas
                            <CmsSelect
                                value={event.data.facility_id}
                                onValueChange={(value) =>
                                    event.setData('facility_id', value)
                                }
                                options={opts.facilities}
                                placeholder="Pilih fasilitas"
                            />
                        </label>
                    </div>
                    <div className="two-col">
                        <label>
                            Mulai *
                            <input
                                type="datetime-local"
                                required
                                value={event.data.starts_at}
                                onChange={(e) =>
                                    event.setData('starts_at', e.target.value)
                                }
                            />
                        </label>
                        <label>
                            Selesai
                            <input
                                type="datetime-local"
                                value={event.data.ends_at}
                                onChange={(e) =>
                                    event.setData('ends_at', e.target.value)
                                }
                            />
                        </label>
                    </div>
                    <label>
                        Status
                        <CmsSelect
                            value={event.data.status}
                            onValueChange={(value) =>
                                event.setData('status', value)
                            }
                            options={[
                                { value: 'upcoming', label: 'Akan datang' },
                                { value: 'draft', label: 'Draf' },
                                { value: 'ongoing', label: 'Berlangsung' },
                                { value: 'completed', label: 'Selesai' },
                                { value: 'cancelled', label: 'Dibatalkan' },
                            ]}
                        />
                    </label>
                    <fieldset className="reminder-settings">
                        <legend>Pengingat kalender</legend>
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={event.data.reminder_enabled}
                                onChange={(e) => event.setData('reminder_enabled', e.target.checked)}
                            />
                            <span>Aktifkan pengingat untuk acara ini</span>
                        </label>
                        {event.data.reminder_enabled && (
                            <label>
                                Ingatkan berapa hari sebelumnya?
                                <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    required
                                    value={event.data.reminder_days_before}
                                    onChange={(e) => event.setData('reminder_days_before', Number(e.target.value))}
                                />
                                <small>Gunakan 0 untuk pengingat pada hari acara, atau masukkan H-1, H-2, H-3, dan seterusnya.</small>
                            </label>
                        )}
                    </fieldset>
                    <MultiImageUpload
                        files={event.data.images}
                        onChange={(files) => event.setData('images', files)}
                        primary={event.data.primary_image}
                        onPrimaryChange={(index) =>
                            event.setData('primary_image', index)
                        }
                        existing={
                            editing?.galleries ||
                            (editing?.image ? [{ image: editing.image }] : [])
                        }
                        onDeleteExisting={requestImageDelete}
                    />
                    <Submit
                        processing={event.processing}
                        editing={Boolean(editing)}
                    />
                </form>
            </CmsModal>
            <CmsModal
                open={taxonomy !== null}
                onOpenChange={(open) => !open && setTaxonomy(null)}
                title={`${editingTaxonomy ? 'Edit' : 'Tambah'} ${taxonomy === 'category' ? 'kategori' : 'tag'}`}
                size="sm"
            >
                <form className="cms-form modal-form" onSubmit={submitTaxonomy}>
                    <label>
                        Nama *
                        <input
                            required
                            value={
                                taxonomy === 'category'
                                    ? category.data.name
                                    : tag.data.name
                            }
                            onChange={(e) =>
                                taxonomy === 'category'
                                    ? category.setData('name', e.target.value)
                                    : tag.setData('name', e.target.value)
                            }
                        />
                    </label>
                    {taxonomy === 'category' && (
                        <label>
                            Deskripsi
                            <RichTextEditor
                                label="Deskripsi kategori"
                                value={category.data.description}
                                onChange={(value) =>
                                    category.setData('description', value)
                                }
                            />
                        </label>
                    )}
                    <Submit
                        processing={
                            taxonomy === 'category'
                                ? category.processing
                                : tag.processing
                        }
                        editing={Boolean(editingTaxonomy)}
                    />
                </form>
            </CmsModal>
            <ConfirmDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                itemName={deleteTarget?.name}
                onConfirm={remove}
                processing={deleting}
            />
            <StatusDialog
                open={Boolean(status)}
                onOpenChange={(open) => !open && setStatus(null)}
                type={status?.type || 'success'}
                message={status?.message || ''}
            />
        </div>
    );
}
