import { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Booking({ facility, user }: { facility: any; user?: { name: string; email: string } }) {
    const [available, setAvailable] = useState<boolean | null>(null);
    const form = useForm({
        customer_name: user?.name ?? '',
        customer_email: user?.email ?? '',
        customer_phone: '',
        booking_date: '',
        start_time: '',
        duration_minutes: 60,
    });

    const check = async () => {
        if (!form.data.booking_date || !form.data.start_time) return;
        const params = new URLSearchParams({
            booking_date: form.data.booking_date,
            start_time: form.data.start_time,
            duration_minutes: String(form.data.duration_minutes),
        });
        const response = await fetch('/booking/' + facility.slug + '/availability?' + params.toString());
        const data = await response.json();
        setAvailable(data.available);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/booking/' + facility.slug);
    };

    return (
        <>
            <Head title={'Booking ' + facility.name} />
            <main className="mx-auto max-w-3xl px-6 py-12">
                <Link href={'/facilities/' + facility.slug}>← Kembali ke fasilitas</Link>
                <h1 className="mt-6 text-3xl font-semibold">Booking {facility.name}</h1>
                <p className="mt-2 opacity-70">Pilih waktu, cek ketersediaan, lalu lanjutkan pembayaran.</p>
                {!user && <p className="mt-4 rounded border p-4">Silakan login terlebih dahulu untuk melakukan booking.</p>}
                <form onSubmit={submit} className="mt-8 space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>Nama<input required className="mt-1 w-full rounded border p-3" value={form.data.customer_name} onChange={(e) => form.setData('customer_name', e.target.value)} /></label>
                        <label>Email<input required type="email" className="mt-1 w-full rounded border p-3" value={form.data.customer_email} onChange={(e) => form.setData('customer_email', e.target.value)} /></label>
                        <label>WhatsApp<input required className="mt-1 w-full rounded border p-3" placeholder="62812..." value={form.data.customer_phone} onChange={(e) => form.setData('customer_phone', e.target.value)} /></label>
                        <label>Tanggal<input required type="date" className="mt-1 w-full rounded border p-3" value={form.data.booking_date} onChange={(e) => { form.setData('booking_date', e.target.value); setAvailable(null); }} /></label>
                        <label>Jam mulai<input required type="time" className="mt-1 w-full rounded border p-3" value={form.data.start_time} onChange={(e) => { form.setData('start_time', e.target.value); setAvailable(null); }} /></label>
                        <label>Durasi<select className="mt-1 w-full rounded border p-3" value={form.data.duration_minutes} onChange={(e) => { form.setData('duration_minutes', Number(e.target.value)); setAvailable(null); }}>{[30,60,90,120,180,240].map((x) => <option key={x} value={x}>{x / 60} jam</option>)}</select></label>
                    </div>
                    <button type="button" className="rounded border px-5 py-3" onClick={check}>Cek Ketersediaan</button>
                    {available !== null && <p className={available ? 'text-green-700' : 'text-red-700'}>{available ? 'Slot tersedia.' : 'Slot sudah terisi. Silakan pilih waktu lain.'}</p>}
                    {form.errors.booking && <p className="text-red-700">{form.errors.booking}</p>}
                    <button disabled={form.processing || available !== true || !user} className="rounded bg-black px-5 py-3 text-white disabled:opacity-40">Buat Booking & Lanjutkan Pembayaran</button>
                </form>
            </main>
        </>
    );
}
