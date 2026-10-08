import { CmsMultiSelect, CmsSelect, ConfirmDialog, StatusDialog } from '@/components/admin-cms';
import { AdminSidebar, AdminTopbar } from '@/components/admin-layout';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { RichTextEditor } from '@/components/rich-text-editor';
import { asset } from '@/components/public-site';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ChevronLeft, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

const sectionFallbacks: Record<string, any> = {
    overview: { eyebrow: 'Informasi fasilitas', title: 'Satu Tempat, Banyak Aktivitas Seru', description: '', enabled: true },
    gallery: { eyebrow: 'Dokumentasi visual', title: 'Galeri Fasilitas', description: '', enabled: true },
    features: { eyebrow: 'Fasilitas pendukung', title: 'Nyaman untuk Atlet dan Penonton', description: 'Fasilitas penunjang lengkap untuk mendukung atlet, wasit, dan komunitas.', enabled: true },
    sports: { eyebrow: '', title: 'Olahraga yang Tersedia di Sini', description: '', enabled: true },
    booking: { eyebrow: '', title: 'Siap menggunakan GGM?', description: 'Hubungi pengelola untuk memeriksa jadwal dan melakukan reservasi.', button_label: 'Hubungi untuk reservasi', enabled: true },
};

function sectionValues(key: string, defaults: any, ownSections: any[]) {
    const global = defaults?.[key] || {};
    const own = ownSections.find((item: any) => item.section_key === key) || {};
    return {
        ...sectionFallbacks[key],
        ...global,
        ...own,
        enabled: own.id ? Boolean(own.enabled) : global.enabled !== false,
    };
}

export default function FacilityEditor({ facility, regions, sports, sectionDefaults }: any) {
    const { flash } = usePage().props as any;
    const ownSections = facility?.content_sections || [];
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [imageDelete, setImageDelete] = useState<any>(null);
    const form = useForm({
        name: facility?.name || '',
        subtitle: facility?.subtitle || '',
        description: facility?.description || '',
        address: facility?.address || '',
        venue_type: facility?.venue_type || '',
        capacity: facility?.capacity || '',
        operating_hours: facility?.operating_hours || '',
        dimensions: facility?.dimensions || '',
        latitude: facility?.latitude || '',
        longitude: facility?.longitude || '',
        region_id: facility?.region_id ? String(facility.region_id) : '',
        sports: (facility?.sports || []).map((item: any) => item.id),
        specifications: (facility?.specifications || []).map((item: any) => ({ label: item.label, value: item.value })) as Array<{ label: string; value: string }>,
        features: (facility?.features || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            image: null as File | null,
            existing_image: item.image || '',
            remove_image: false,
        })) as Array<{ id: number | null; name: string; description: string; image: File | null; existing_image: string; remove_image: boolean }>,
        sections: {
            overview: sectionValues('overview', sectionDefaults, ownSections),
            gallery: sectionValues('gallery', sectionDefaults, ownSections),
            features: sectionValues('features', sectionDefaults, ownSections),
            sports: sectionValues('sports', sectionDefaults, ownSections),
            booking: sectionValues('booking', sectionDefaults, ownSections),
        },
        images: [] as File[],
        primary_image: 0,
        published: facility ? Boolean(facility.published) : true,
    });

    useEffect(() => {
        if (flash?.success) setStatus({ type: 'success', message: flash.success });
    }, [flash?.success]);

    const setSection = (key: string, field: string, value: any) => {
        form.setData('sections', {
            ...form.data.sections,
            [key]: { ...form.data.sections[key as keyof typeof form.data.sections], [field]: value },
        });
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors: Record<string, string>) => setStatus({
                type: 'error',
                message: Object.values(errors)[0] || 'Periksa kembali informasi fasilitas.',
            }),
        };
        if (facility) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/facilities/${facility.encrypted_id}`, options);
        } else form.post('/admin/facilities', options);
    };
    const removeGalleryImage = () => {
        if (!imageDelete || !facility) return;
        router.delete(`/admin/facilities/${facility.encrypted_id}/images/${imageDelete.encrypted_id}`, {
            preserveScroll: true,
            onSuccess: () => setImageDelete(null),
            onError: (errors) => setStatus({ type: 'error', message: Object.values(errors)[0] || 'Gambar tidak dapat dihapus.' }),
        });
    };

    const sectionHeader = (key: string, label: string, help: string) => (
        <div className="facility-editor-section-head">
            <div><h2>{label}</h2><p>{help}</p></div>
            <label className="toggle-label">
                <input type="checkbox" checked={form.data.sections[key as keyof typeof form.data.sections].enabled} onChange={(event) => setSection(key, 'enabled', event.target.checked)} />
                Tampilkan section
            </label>
        </div>
    );

    return (
        <div className="admin-shell">
            <Head title={facility ? `Edit ${facility.name}` : 'Tambah fasilitas'} />
            <AdminSidebar active="content" contentSection="facilities" />
            <main className="admin-main facility-editor-page">
                <AdminTopbar
                    title={facility ? `Edit ${facility.name}` : 'Tambah Fasilitas'}
                    description="Kelola isi halaman fasilitas mengikuti urutan yang dilihat pengunjung."
                    action={<button form="facility-editor-form" className="button" disabled={form.processing}><Save aria-hidden="true" />{form.processing ? 'Menyimpan...' : 'Simpan fasilitas'}</button>}
                />
                <div className="facility-editor-toolbar">
                    <Link href="/admin/content?tab=facilities" className="text-link"><ChevronLeft aria-hidden="true" /> Kembali ke daftar fasilitas</Link>
                    {facility && <a href={`/facilities/${facility.slug}`} target="_blank" rel="noreferrer" className="button secondary">Lihat halaman publik</a>}
                </div>
                <nav className="facility-editor-nav" aria-label="Bagian editor fasilitas">
                    <a href="#informasi-utama">Informasi utama</a>
                    <a href="#informasi-fasilitas">Informasi fasilitas</a>
                    <a href="#galeri">Galeri</a>
                    <a href="#fasilitas-pendukung">Fasilitas pendukung</a>
                    <a href="#olahraga">Olahraga</a>
                    <a href="#reservasi">Reservasi</a>
                </nav>
                <form id="facility-editor-form" className="facility-editor-form cms-form" onSubmit={submit}>
                    <section id="informasi-utama" className="admin-panel facility-editor-section">
                        <div className="facility-editor-section-head"><div><h2>Informasi utama</h2><p>Identitas, deskripsi, lokasi, dan status publikasi fasilitas.</p></div></div>
                        <div className="two-col">
                            <label>Nama fasilitas *<input required value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></label>
                            <label>Subjudul<input value={form.data.subtitle} onChange={(e) => form.setData('subtitle', e.target.value)} /></label>
                        </div>
                        <label>Deskripsi utama<RichTextEditor label="Deskripsi utama fasilitas" value={form.data.description} onChange={(value) => form.setData('description', value)} /></label>
                        <div className="two-col">
                            <label>Wilayah<CmsSelect value={form.data.region_id} onValueChange={(value) => form.setData('region_id', value)} options={regions.map((item: any) => ({ value: String(item.id), label: item.name }))} placeholder="Pilih wilayah" /></label>
                            <label>Jenis tempat<input value={form.data.venue_type} onChange={(e) => form.setData('venue_type', e.target.value)} placeholder="Contoh: Arena dalam ruangan" /></label>
                        </div>
                        <label>Alamat<input value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} /></label>
                        <div className="two-col">
                            <label>Latitude<input type="number" step="any" value={form.data.latitude} onChange={(e) => form.setData('latitude', e.target.value)} /></label>
                            <label>Longitude<input type="number" step="any" value={form.data.longitude} onChange={(e) => form.setData('longitude', e.target.value)} /></label>
                        </div>
                        <label className="toggle-label"><input type="checkbox" checked={form.data.published} onChange={(e) => form.setData('published', e.target.checked)} />Publikasikan fasilitas</label>
                    </section>

                    <section id="informasi-fasilitas" className="admin-panel facility-editor-section">
                        {sectionHeader('overview', 'Section Informasi Fasilitas', 'Atur judul section serta data teknis yang berbeda untuk setiap jenis fasilitas.')}
                        <div className="two-col">
                            <label>Label kecil<input value={form.data.sections.overview.eyebrow || ''} onChange={(e) => setSection('overview', 'eyebrow', e.target.value)} /></label>
                            <label>Judul section *<input required value={form.data.sections.overview.title} onChange={(e) => setSection('overview', 'title', e.target.value)} /></label>
                        </div>
                        <label>Deskripsi section<RichTextEditor label="Deskripsi informasi fasilitas" value={form.data.sections.overview.description || ''} onChange={(value) => setSection('overview', 'description', value)} /></label>
                        <div className="three-col">
                            <label>Kapasitas umum<input value={form.data.capacity} onChange={(e) => form.setData('capacity', e.target.value)} placeholder="Contoh: 500 orang" /></label>
                            <label>Jam operasional<input value={form.data.operating_hours} onChange={(e) => form.setData('operating_hours', e.target.value)} placeholder="08.00 - 22.00" /></label>
                            <label>Dimensi umum<input value={form.data.dimensions} onChange={(e) => form.setData('dimensions', e.target.value)} placeholder="40 x 20 meter" /></label>
                        </div>
                        <div className="repeater-heading"><div><h3>Spesifikasi khusus</h3><p>Gunakan label dan nilai yang relevan untuk fasilitas ini.</p></div><button type="button" className="button secondary" onClick={() => form.setData('specifications', [...form.data.specifications, { label: '', value: '' }])}><Plus aria-hidden="true" /> Tambah spesifikasi</button></div>
                        {form.data.specifications.length === 0 && <div className="admin-empty compact">Belum ada spesifikasi khusus.</div>}
                        {form.data.specifications.map((item, index) => <div className="facility-specification-row" key={index}>
                            <label>Label<input required value={item.label} onChange={(e) => { const next = [...form.data.specifications]; next[index] = { ...item, label: e.target.value }; form.setData('specifications', next); }} placeholder="Contoh: Tinggi dinding" /></label>
                            <label>Nilai<input required value={item.value} onChange={(e) => { const next = [...form.data.specifications]; next[index] = { ...item, value: e.target.value }; form.setData('specifications', next); }} placeholder="Contoh: 15 meter" /></label>
                            <button type="button" className="icon-button danger" aria-label={`Hapus ${item.label || 'spesifikasi'}`} onClick={() => form.setData('specifications', form.data.specifications.filter((_, current) => current !== index))}><Trash2 aria-hidden="true" /></button>
                        </div>)}
                    </section>

                    <section id="galeri" className="admin-panel facility-editor-section">
                        {sectionHeader('gallery', 'Section Galeri', 'Atur judul dan semua foto yang tampil pada galeri fasilitas.')}
                        <div className="two-col"><label>Label kecil<input value={form.data.sections.gallery.eyebrow || ''} onChange={(e) => setSection('gallery', 'eyebrow', e.target.value)} /></label><label>Judul section *<input required value={form.data.sections.gallery.title} onChange={(e) => setSection('gallery', 'title', e.target.value)} /></label></div>
                        <label>Deskripsi section<RichTextEditor label="Deskripsi galeri fasilitas" value={form.data.sections.gallery.description || ''} onChange={(value) => setSection('gallery', 'description', value)} /></label>
                        <MultiImageUpload files={form.data.images} onChange={(files) => form.setData('images', files)} primary={form.data.primary_image} onPrimaryChange={(index) => form.setData('primary_image', index)} existing={facility?.galleries || []} onDeleteExisting={(image) => setImageDelete(image)} />
                    </section>

                    <section id="fasilitas-pendukung" className="admin-panel facility-editor-section">
                        {sectionHeader('features', 'Section Fasilitas Pendukung', 'Tambahkan fasilitas penunjang beserta deskripsi dan gambarnya.')}
                        <div className="two-col"><label>Label kecil<input value={form.data.sections.features.eyebrow || ''} onChange={(e) => setSection('features', 'eyebrow', e.target.value)} /></label><label>Judul section *<input required value={form.data.sections.features.title} onChange={(e) => setSection('features', 'title', e.target.value)} /></label></div>
                        <label>Deskripsi section<RichTextEditor label="Deskripsi fasilitas pendukung" value={form.data.sections.features.description || ''} onChange={(value) => setSection('features', 'description', value)} /></label>
                        <div className="repeater-heading"><div><h3>Daftar fasilitas pendukung</h3><p>Contoh: tribun, toilet, ruang ganti, CCTV, atau area parkir.</p></div><button type="button" className="button secondary" onClick={() => form.setData('features', [...form.data.features, { id: null, name: '', description: '', image: null, existing_image: '', remove_image: false }])}><Plus aria-hidden="true" /> Tambah fasilitas</button></div>
                        {form.data.features.length === 0 && <div className="admin-empty compact">Belum ada fasilitas pendukung.</div>}
                        <div className="facility-feature-editor-list">{form.data.features.map((item, index) => <article className="facility-feature-editor" key={item.id || index}>
                            <div className="facility-feature-editor-main"><label>Nama fasilitas *<input required value={item.name} onChange={(e) => { const next = [...form.data.features]; next[index] = { ...item, name: e.target.value }; form.setData('features', next); }} /></label><label>Deskripsi<textarea value={item.description} onChange={(e) => { const next = [...form.data.features]; next[index] = { ...item, description: e.target.value }; form.setData('features', next); }} /></label></div>
                            <div className="facility-feature-media">
                                {item.existing_image && !item.remove_image && <img src={asset(item.existing_image)} alt="Preview fasilitas pendukung" />}
                                {item.image && <img src={URL.createObjectURL(item.image)} alt="Preview gambar baru" />}
                                <label className="upload compact"><ImagePlus aria-hidden="true" /> Pilih gambar<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const next = [...form.data.features]; next[index] = { ...item, image: e.target.files?.[0] || null, remove_image: false }; form.setData('features', next); }} /></label>
                                {item.existing_image && !item.remove_image && <button type="button" className="text-button danger" onClick={() => { const next = [...form.data.features]; next[index] = { ...item, remove_image: true, image: null }; form.setData('features', next); }}>Hapus gambar</button>}
                            </div>
                            <button type="button" className="icon-button danger facility-feature-remove" aria-label={`Hapus ${item.name || 'fasilitas pendukung'}`} onClick={() => form.setData('features', form.data.features.filter((_, current) => current !== index))}><Trash2 aria-hidden="true" /></button>
                        </article>)}</div>
                    </section>

                    <section id="olahraga" className="admin-panel facility-editor-section">
                        {sectionHeader('sports', 'Section Olahraga yang Tersedia', 'Pilih cabang olahraga yang dapat dimainkan di fasilitas ini.')}
                        <div className="two-col"><label>Label kecil<input value={form.data.sections.sports.eyebrow || ''} onChange={(e) => setSection('sports', 'eyebrow', e.target.value)} /></label><label>Judul section *<input required value={form.data.sections.sports.title} onChange={(e) => setSection('sports', 'title', e.target.value)} /></label></div>
                        <label>Deskripsi section<RichTextEditor label="Deskripsi olahraga tersedia" value={form.data.sections.sports.description || ''} onChange={(value) => setSection('sports', 'description', value)} /></label>
                        <label>Olahraga<CmsMultiSelect values={form.data.sports} onChange={(values) => form.setData('sports', values)} options={sports.map((item: any) => ({ value: item.id, label: item.name }))} placeholder="Pilih olahraga yang tersedia" /></label>
                    </section>

                    <section id="reservasi" className="admin-panel facility-editor-section">
                        {sectionHeader('booking', 'Section Reservasi', 'Atur ajakan yang tampil pada bagian akhir halaman fasilitas.')}
                        <label>Judul section *<input required value={form.data.sections.booking.title} onChange={(e) => setSection('booking', 'title', e.target.value)} /></label>
                        <label>Deskripsi<RichTextEditor label="Deskripsi reservasi" value={form.data.sections.booking.description || ''} onChange={(value) => setSection('booking', 'description', value)} /></label>
                        <label>Teks tombol<input value={form.data.sections.booking.button_label || ''} onChange={(e) => setSection('booking', 'button_label', e.target.value)} /></label>
                    </section>
                    <div className="facility-editor-submit"><button className="button" disabled={form.processing}><Save aria-hidden="true" />{form.processing ? 'Menyimpan...' : 'Simpan semua perubahan'}</button></div>
                </form>
            </main>
            <StatusDialog open={Boolean(status)} onOpenChange={(open) => !open && setStatus(null)} type={status?.type || 'success'} message={status?.message || ''} />
            <ConfirmDialog open={Boolean(imageDelete)} onOpenChange={(open) => !open && setImageDelete(null)} itemName="Gambar galeri fasilitas" onConfirm={removeGalleryImage} />
        </div>
    );
}
