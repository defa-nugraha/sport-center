import { FormEvent, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { CalendarCheck, CalendarDays, CheckCircle2, Clock3, Info, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/date-range-picker';
import { UserShell } from '@/components/user-layout';

export default function Booking({ facility, user }: { facility: any; user: { name: string; email: string } }) {
    const mode = facility.booking_mode || 'hourly';
    const isDaily = mode === 'daily';
    const minimumHours = Math.max(1, Number(facility.booking_min_hours || 1));
    const [available, setAvailable] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(false);
    const [availabilityMessage, setAvailabilityMessage] = useState('');
    const form = useForm({
        customer_phone: '',
        booking_date: '',
        booking_end_date: '',
        start_time: '',
        duration_minutes: minimumHours * 60,
    });

    const durationOptions = useMemo(() => {
        const options: number[] = [];
        for (let minutes = minimumHours * 60; minutes <= 720; minutes += 30) options.push(minutes);
        return options;
    }, [minimumHours]);

    const check = async () => {
        if (isDaily) {
            if (!form.data.booking_date || !form.data.booking_end_date) {
                setAvailabilityMessage('Pilih rentang tanggal terlebih dahulu.');
                setAvailable(false);
                return;
            }
        } else if (!form.data.booking_date || !form.data.start_time) {
            setAvailabilityMessage('Pilih tanggal dan jam mulai terlebih dahulu.');
            setAvailable(false);
            return;
        }

        setChecking(true);
        setAvailabilityMessage('');

        try {
            const params = new URLSearchParams({
                booking_date: form.data.booking_date,
                ...(isDaily
                    ? { booking_end_date: form.data.booking_end_date }
                    : {
                        start_time: form.data.start_time,
                        duration_minutes: String(form.data.duration_minutes),
                    }),
            });
            const response = await fetch('/booking/' + facility.slug + '/availability?' + params.toString(), {
                headers: { Accept: 'application/json' },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ketersediaan venue belum dapat diperiksa.');
            setAvailable(Boolean(data.available));
            setAvailabilityMessage(
                data.available
                    ? isDaily
                        ? `${data.days} hari tersedia. Kamu bisa melanjutkan booking.`
                        : 'Slot tersedia. Kamu bisa melanjutkan booking.'
                    : isDaily
                        ? 'Sebagian tanggal dalam rentang tersebut sudah terisi. Silakan pilih rentang lain.'
                        : 'Slot sudah terisi. Silakan pilih waktu lain.',
            );
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
                    <div>
                        <span className="eyebrow"><i /> Venue pilihan</span>
                        <h2>{facility.name}</h2>
                        <p>{facility.subtitle || facility.venue_type}</p>
                        <div className="booking-flow-meta">
                            <span><MapPin /> {facility.address || 'GGM Majalengka'}</span>
                            <span>{isDaily ? <><CalendarDays /> Booking per hari</> : <><Clock3 /> Minimal {minimumHours} jam</>}</span>
                        </div>
                        <strong>
                            Rp {Number(isDaily ? facility.booking_price_per_day || 0 : facility.booking_price_per_hour || 0).toLocaleString('id-ID')}
                            <small>{isDaily ? ' / hari' : ' / jam'}</small>
                        </strong>
                    </div>
                </div>

                <form onSubmit={submit} className="user-panel booking-form-panel" aria-busy={checking || form.processing}>
                    <ol className="booking-progress" aria-label="Tahapan booking">
                        <li className="active"><span>1</span><strong>Jadwal</strong></li>
                        <li className={available === true ? 'active' : ''}><span>2</span><strong>Ketersediaan</strong></li>
                        <li><span>3</span><strong>Pembayaran</strong></li>
                    </ol>

                    <div className="user-panel-head">
                        <div>
                            <span className="eyebrow"><i /> Detail pemesanan</span>
                            <h2>{isDaily ? 'Pilih rentang tanggal' : 'Pilih jadwal'}</h2>
                            <p>{isDaily ? 'Pilih tanggal mulai dan selesai. Harga dihitung berdasarkan jumlah hari.' : `Booking minimum ${minimumHours} jam. Harga dihitung berdasarkan durasi.`}</p>
                        </div>
                        <CalendarDays />
                    </div>

                    <div className={isDaily ? 'booking-step-grid booking-daily-grid' : 'booking-step-grid'}>
                        {isDaily ? (
                            <label className="booking-date-range-field">
                                Tanggal penggunaan
                                <DateRangePicker
                                    start={form.data.booking_date}
                                    end={form.data.booking_end_date}
                                    minDate={new Date().toISOString().slice(0, 10)}
                                    onChange={(start, end) => {
                                        form.setData('booking_date', start);
                                        form.setData('booking_end_date', end);
                                        setAvailable(null);
                                        setAvailabilityMessage('');
                                    }}
                                    disabled={checking || form.processing}
                                />
                                <small>Pilih rentang hari yang ingin digunakan untuk venue.</small>
                            </label>
                        ) : (
                            <>
                                <label htmlFor="booking-date">Tanggal<input id="booking-date" required type="date" min={new Date().toISOString().slice(0, 10)} value={form.data.booking_date} onChange={(e) => { form.setData('booking_date', e.target.value); form.setData('booking_end_date', e.target.value); setAvailable(null); setAvailabilityMessage(''); }} /></label>
                                <label htmlFor="booking-start-time">Jam mulai<input id="booking-start-time" required type="time" value={form.data.start_time} onChange={(e) => { form.setData('start_time', e.target.value); setAvailable(null); setAvailabilityMessage(''); }} /></label>
                                <label htmlFor="booking-duration">Durasi<Select value={String(form.data.duration_minutes)} onValueChange={(value) => { form.setData('duration_minutes', Number(value)); setAvailable(null); setAvailabilityMessage(''); }}><SelectTrigger id="booking-duration" className="user-select-trigger" aria-label="Durasi booking"><SelectValue placeholder="Pilih durasi" /></SelectTrigger><SelectContent>{durationOptions.map((minutes) => <SelectItem key={minutes} value={String(minutes)}>{minutes / 60} jam</SelectItem>)}</SelectContent></Select></label>
                            </>
                        )}

                        <label htmlFor="customer-phone">Nomor WhatsApp<input id="customer-phone" required placeholder="08xxxxxxxxxx" value={form.data.customer_phone} onChange={(e) => form.setData('customer_phone', e.target.value)} /><small>Digunakan untuk notifikasi booking.</small></label>
                    </div>

                    <div className="booking-account-note"><CheckCircle2 /><div><strong>{user.name}</strong><span>{user.email}</span></div><small>Akun yang digunakan untuk booking</small></div>

                    <div className="booking-check-row">
                        <button type="button" className="button" onClick={check} disabled={checking || form.processing} aria-describedby="availability-message">
                            {checking ? 'Memeriksa...' : 'Cek ketersediaan'}
                        </button>
                        {available === true && <span id="availability-message" role="status" className="booking-availability success"><CheckCircle2 /> Slot tersedia</span>}
                        {available === false && availabilityMessage && <span id="availability-message" role="alert" className="booking-availability error">{availabilityMessage}</span>}
                    </div>

                    {available === true && <div className="booking-ready" role="status"><Info /><span>{availabilityMessage}</span></div>}
                    {bookingError && <p className="form-error">{bookingError}</p>}
                    <button type="submit" disabled={form.processing || available !== true} className="button booking-submit"><CalendarCheck /> {form.processing ? 'Membuat booking...' : 'Buat booking & lanjutkan pembayaran'}</button>
                </form>
            </section>
        </UserShell>
    );
}
