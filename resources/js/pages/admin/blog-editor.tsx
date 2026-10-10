import {
    CmsMultiSelect,
    CmsSelect,
    ConfirmDialog,
    StatusDialog,
} from '@/components/admin-cms';
import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { AdminBlogEditorSkeleton, usePageLoading } from '@/components/page-skeletons';

export default function BlogEditor({ post, categories, tags }: any) {
    const loading = usePageLoading();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };
    const [status, setStatus] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const [imageDelete, setImageDelete] = useState<{
        url: string;
        name: string;
    } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const form = useForm({
        title: post?.title || '',
        excerpt: post?.excerpt || '',
        body: post?.body || '',
        blog_category_id: post?.blog_category_id
            ? String(post.blog_category_id)
            : '',
        tags: (post?.tags || []).map((tag: any) => tag.id),
        status: post?.status || 'draft',
        featured: Boolean(post?.featured),
        published_at: post?.published_at?.slice(0, 16) || '',
        images: [] as File[],
        primary_image: 0,
        seo_title: post?.seo_title || '',
        seo_description: post?.seo_description || '',
        canonical_url: post?.canonical_url || '',
    });
    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
        if (flash?.error) setStatus({ type: 'error', message: flash.error });
    }, [flash?.success, flash?.error]);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setStatus({ type: 'success', message: post ? 'Artikel berhasil diperbarui.' : 'Artikel berhasil dibuat.' }),
            onError: (errors: Record<string, string>) =>
                setStatus({
                    type: 'error' as const,
                    message:
                        Object.values(errors)[0] ||
                        'Periksa kembali data artikel.',
                }),
        };
        if (post) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/blog/posts/${post.encrypted_id}`, options);
        } else form.post('/admin/blog/posts', options);
    };
    const removeImage = () => {
        if (!imageDelete) return;
        setDeleting(true);
        router.delete(imageDelete.url, {
            preserveScroll: true,
            onSuccess: () => {
                setImageDelete(null);
                setStatus({ type: 'success', message: 'Gambar artikel berhasil dihapus.' });
            },
            onError: (errors) =>
                setStatus({
                    type: 'error',
                    message:
                        Object.values(errors)[0] ||
                        'Gambar tidak dapat dihapus.',
                }),
            onFinish: () => setDeleting(false),
        });
    };
    if (loading) return <AdminBlogEditorSkeleton />;
    return (
        <div className="admin-shell">
            <Head title={post ? 'Edit artikel' : 'Tulis artikel'} />
            <AdminSidebar active="content" contentSection="blog" />
            <main className="admin-main blog-editor-page">
                <AdminTopbar
                    title={post ? 'Edit Artikel' : 'Tulis Artikel Baru'}
                    description="Susun kabar yang ramah dibaca dan mudah ditemukan."
                    action={
                        <button
                            form="blog-editor-form"
                            className="button"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'Menyimpan...'
                                : 'Simpan artikel'}
                        </button>
                    }
                />
                <form
                    id="blog-editor-form"
                    className="blog-editor-layout"
                    onSubmit={submit}
                >
                    <section className="admin-panel cms-form">
                        <label>
                            Judul artikel *
                            <input
                                required
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                            />
                        </label>
                        <label>
                            Ringkasan singkat
                            <textarea
                                maxLength={500}
                                value={form.data.excerpt}
                                onChange={(e) =>
                                    form.setData('excerpt', e.target.value)
                                }
                            />
                        </label>
                        <label>
                            Isi artikel *
                            <RichTextEditor
                                label="Isi artikel"
                                value={form.data.body}
                                onChange={(value) =>
                                    form.setData('body', value)
                                }
                            />
                        </label>
                        <MultiImageUpload
                            files={form.data.images}
                            onChange={(files) => form.setData('images', files)}
                            primary={form.data.primary_image}
                            onPrimaryChange={(index) =>
                                form.setData('primary_image', index)
                            }
                            existing={post?.images || []}
                            onDeleteExisting={(image) =>
                                image.encrypted_id &&
                                setImageDelete({
                                    url: `/admin/blog/posts/${post.encrypted_id}/images/${image.encrypted_id}`,
                                    name: `Gambar ${post.title}`,
                                })
                            }
                        />
                    </section>
                    <aside className="blog-editor-sidebar">
                        <section className="admin-panel cms-form">
                            <h2>Publikasi</h2>
                            <label>
                                Status
                                <CmsSelect
                                    value={form.data.status}
                                    onValueChange={(value) =>
                                        form.setData('status', value)
                                    }
                                    options={[
                                        { value: 'draft', label: 'Draf' },
                                        { value: 'published', label: 'Terbit' },
                                    ]}
                                />
                            </label>
                            <label>
                                Waktu terbit
                                <input
                                    type="datetime-local"
                                    value={form.data.published_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'published_at',
                                            e.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="check-field">
                                <input
                                    type="checkbox"
                                    checked={form.data.featured}
                                    onChange={(e) =>
                                        form.setData(
                                            'featured',
                                            e.target.checked,
                                        )
                                    }
                                />{' '}
                                Jadikan artikel unggulan
                            </label>
                        </section>
                        <section className="admin-panel cms-form">
                            <h2>Pengelompokan</h2>
                            <label>
                                Kategori
                                <CmsSelect
                                    value={form.data.blog_category_id}
                                    onValueChange={(value) =>
                                        form.setData('blog_category_id', value)
                                    }
                                    options={categories.map((item: any) => ({
                                        value: String(item.id),
                                        label: item.name,
                                    }))}
                                    placeholder="Pilih kategori"
                                />
                            </label>
                            <label>
                                Tag
                                <CmsMultiSelect
                                    values={form.data.tags}
                                    onChange={(values) =>
                                        form.setData('tags', values)
                                    }
                                    options={tags.map((item: any) => ({
                                        value: item.id,
                                        label: item.name,
                                    }))}
                                    placeholder="Pilih tag"
                                />
                            </label>
                        </section>
                        <section className="admin-panel cms-form">
                            <h2>Optimasi pencarian</h2>
                            <label>
                                Judul SEO
                                <input
                                    maxLength={70}
                                    value={form.data.seo_title}
                                    onChange={(e) =>
                                        form.setData(
                                            'seo_title',
                                            e.target.value,
                                        )
                                    }
                                />
                                <small>{form.data.seo_title.length}/70</small>
                            </label>
                            <label>
                                Deskripsi SEO
                                <textarea
                                    maxLength={320}
                                    value={form.data.seo_description}
                                    onChange={(e) =>
                                        form.setData(
                                            'seo_description',
                                            e.target.value,
                                        )
                                    }
                                />
                                <small>
                                    {form.data.seo_description.length}/320
                                </small>
                            </label>
                            <label>
                                URL kanonis
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={form.data.canonical_url}
                                    onChange={(e) =>
                                        form.setData(
                                            'canonical_url',
                                            e.target.value,
                                        )
                                    }
                                />
                            </label>
                        </section>
                    </aside>
                </form>
            </main>
                <StatusDialog
                open={Boolean(status)}
                onOpenChange={(open) => !open && setStatus(null)}
                type={status?.type || 'success'}
                message={status?.message || ''}
                />
                <ConfirmDialog
                    open={Boolean(imageDelete)}
                    onOpenChange={(open) => !open && setImageDelete(null)}
                    itemName={imageDelete?.name}
                    onConfirm={removeImage}
                    processing={deleting}
                />
        </div>
    );
}
