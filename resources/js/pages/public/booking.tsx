import { FormEvent, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { CalendarCheck, CalendarDays, CheckCircle2, Clock3, Info, MapPin } from 'lucide-react';
import { UserShell } from '@/components/user-layout';

export default function Booking({ facility, user }: { facility: any; user: { name: string; email: string } }) {
    const minimumHours = Math.max(1, Number(facility.booking_min_hours || 1));
    const [available, setAvailable] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(false);
    const [availabilityMessage, setAvailabilityMessage] = useState('');
    const form = useForm({
        customer_phone: '',
        booking_date: '',
        start_time: '',
        duration_minutes: minimumHours * 60,
    });

    const durationOptions = useMemo(() => {
        const options: number[] = [];
        for (let minutes = minimumHours * 60; minutes <= 720; minutes += 30) options.push(minutes);
        return options;
    }, [minimumHours]);

    const check = async () => {
        if (!form.data.booking_date || !form.data.start_time) {
            setAvailabilityMessage('Pilih tanggal dan jam mulai terlebih dahulu.');
            setAvailable(false);
            return;
        }
        setChecking(true);
        setAvailabilityMessage('');
        try {
            const params = new URLSearchParams({
                booking_date: form.data.booking_date,
                start_time: form.data.start_time,
                duration_minutes: String(form.data.duration_minutes),
            });
            const response = await fetch('/booking/' + facility.slug + '/availability?' + params.toString(), {
                headers: { Accept: 'application/json' },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ketersediaan venue belum dapat diperiksa.');
            setAvailable(Boolean(data.available));
            setAvailabilityMessage(data.available ? 'Slot tersedia. Kamu bisa melanjutkan booking.' : 'Slot sudah terisi. Silakan pilih waktu lain.');
        } catch (error) {
            setAvailable(false);
            setAvailabilityMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa ketersediaan.');
        } finally {
            setChecking(false);
        }
    };

    const bookingError = (form.errors as Record<string, string | undefined>).booking;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/booking/' + facility.slug);
    };

    return (
        <UserShell active="booking" title={'Booking ' + facility.name} description="Pilih jadwal yang sesuai, cek ketersediaan, lalu lanjutkan pembayaran.">
            <section className="booking-flow">
                <div className="booking-flow-summary">
                    <div className="booking-flow-image"><img src={facility.hero_image || facility.thumbnail || '/assets/ggm/Lapang Serba Guna (Basket)2 1.png'} alt={facility.name} /></div>
                    <div><span className="eyebrow"><i /> Venue pilihan</span><h2>{facility.name}</h2><p>{facility.subtitle || facility.venue_type}</p><div className="booking-flow-meta"><span><MapPin /> {facility.address || 'GGM Majalengka'}</span><span><Clock3 /> Minimal {minimumHours} jam</span></div><strong>Rp {Number(facility.booking_price_per_hour || 0).toLocaleString('id-ID')} <small>/ jam</small></strong></div>
                </div>

                <form onSubmit={submit} className="user-panel booking-form-panel">
                    <div className="user-panel-head"><div><span className="eyebrow"><i /> Detail pemesanan</span><h2>Pilih jadwal</h2><p>Booking minimum {minimumHours} jam. Harga dihitung berdasarkan durasi.</p></div><CalendarDays /></div>
                    <div className="booking-step-grid">
                        <label>Tanggal<input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.data.booking_date} onChange={(e) => { form.setData('booking_date', e.target.value); setAvailable(null); setAvailabilityMessage(''); }} /></label>
                        <label>Jam mulai<input required type="time" value={form.data.start_time} onChange={(e) => { form.setData('start_time', e.target.value); setAvailable(null); setAvailabilityMessage(''); }} /></label>
                        <label>Durasi<select value={form.data.duration_minutes} onChange={(e) => { form.setData('duration_minutes', Number(e.target.value)); setAvailable(null); setAvailabilityMessage(''); }}>{durationOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes / 60} jam</option>)}</select></label>
                        <label>Nomor WhatsApp<input required placeholder="08xxxxxxxxxx" value={form.data.customer_phone} onChange={(e) => form.setData('customer_phone', e.target.value)} /><small>Digunakan untuk notifikasi booking.</small></label>
                    </div>
                    <div className="booking-account-note"><CheckCircle2 /><div><strong>{user.name}</strong><span>{user.email}</span></div><small>Akun yang digunakan untuk booking</small></div>
                    <div className="booking-check-row"><button type="button" className="button" onClick={check} disabled={checking}>{checking ? 'Memeriksa...' : 'Cek ketersediaan'}</button>{available === true && <span className="booking-availability success"><CheckCircle2 /> Slot tersedia</span>}{available === false && availabilityMessage && <span className="booking-availability error">{availabilityMessage}</span>}</div>
                    {available === true && <div className="booking-ready"><Info /><span>{availabilityMessage}</span></div>}
                    {bookingError && <p className="form-error">{bookingError}</p>}
                    <button type="submit" disabled={form.processing || available !== true} className="button booking-submit"><CalendarCheck /> {form.processing ? 'Membuat booking...' : 'Buat booking & lanjutkan pembayaran'}</button>
                </form>
            </section>
        </UserShell>
    );
}
