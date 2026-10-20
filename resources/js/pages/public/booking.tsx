import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { StatusDialog } from '@/components/admin-cms';
import { CalendarCheck, CalendarDays, CheckCircle2, Clock3, Info, MapPin } from 'lucide-react';
import { DateRangePicker } from '@/components/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserShell } from '@/components/user-layout';

const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};

type HourlySlot = {
    start_time: string;
    end_time: string;
    label: string;
    total: number | null;
};

export default function Booking({ facility, user }: { facility: any; user: { name: string; email: string } }) {
    const supportsBothModes = facility.booking_mode === 'both';
    const [selectedMode, setSelectedMode] = useState<'hourly' | 'daily' | ''>(supportsBothModes ? '' : ((facility.booking_mode || 'hourly') as 'hourly' | 'daily'));
    const daily = selectedMode === 'daily';
    const hourly = selectedMode === 'hourly';
    const minimumHours = Math.max(1, Number(facility.booking_min_hours || 1));
    const [available, setAvailable] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(false);
    const [availabilityMessage, setAvailabilityMessage] = useState('');
    const [hourlySlots, setHourlySlots] = useState<HourlySlot[]>([]);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const form = useForm({
        customer_phone: '',
        booking_date: '',
        booking_end_date: '',
        start_time: '',
        duration_minutes: minimumHours * 60,
        booking_mode: selectedMode,
    });

    const durationOptions = useMemo(() => {
        const options: number[] = [];
        for (let minutes = minimumHours * 60; minutes <= 720; minutes += 30) options.push(minutes);
        return options;
    }, [minimumHours]);

    const loadHourlySlots = async () => {
        if (!hourly || !form.data.booking_date) return;

        setChecking(true);
        setAvailable(null);
        setAvailabilityMessage('');
        setHourlySlots([]);
        try {
            const params = new URLSearchParams({
                booking_date: form.data.booking_date,
                booking_mode: 'hourly',
                duration_minutes: String(form.data.duration_minutes),
            });
            const response = await fetch('/booking/' + facility.slug + '/availability?' + params.toString(), { headers: { Accept: 'application/json' } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ketersediaan venue belum dapat diperiksa.');

            const slots = Array.isArray(data.slots) ? data.slots as HourlySlot[] : [];
            setHourlySlots(slots);
            setAvailabilityMessage(
                slots.length
                    ? `${slots.length} pilihan waktu tersedia. Pilih salah satu waktu di bawah.`
                    : 'Tidak ada waktu yang tersedia untuk durasi tersebut pada tanggal ini.',
            );
        } catch (error) {
            setAvailable(false);
            setAvailabilityMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa ketersediaan.');
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        if (!hourly || !form.data.booking_date) {
            setHourlySlots([]);
            setAvailable(null);
            return;
        }

        form.setData('start_time', '');
        setAvailable(null);
        void loadHourlySlots();
    }, [hourly, form.data.booking_date, form.data.duration_minutes]);

    const checkDaily = async () => {
        if (!form.data.booking_date || !form.data.booking_end_date) {
            setAvailabilityMessage('Pilih tanggal mulai dan tanggal akhir terlebih dahulu.');
            setAvailable(false);
            return;
        }

        setChecking(true);
        setAvailabilityMessage('');
        try {
            const params = new URLSearchParams({
                booking_date: form.data.booking_date,
                booking_mode: 'daily',
                booking_end_date: form.data.booking_end_date,
            });
            const response = await fetch('/booking/' + facility.slug + '/availability?' + params.toString(), { headers: { Accept: 'application/json' } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ketersediaan venue belum dapat diperiksa.');
            setAvailable(Boolean(data.available));
            setAvailabilityMessage(data.available ? `Rentang ${data.days} hari tersedia.` : 'Rentang tanggal yang dipilih sudah terisi. Silakan pilih tanggal lain.');
        } catch (error) {
            setAvailable(false);
            setAvailabilityMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat memeriksa ketersediaan.');
        } finally {
            setChecking(false);
        }
    };

    const selectHourlySlot = (slot: HourlySlot) => {
        form.setData('start_time', slot.start_time);
        setAvailable(true);
        setAvailabilityMessage(`Slot ${slot.label} tersedia untuk ${form.data.duration_minutes / 60} jam.`);
    };

    const bookingError = (form.errors as Record<string, string | undefined>).booking;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!selectedMode || (hourly && !form.data.start_time)) return;
        form.post('/booking/' + facility.slug, {
            onError: (errors) => setStatus({
                type: 'error',
                message: Object.values(errors)[0] || 'Booking gagal dibuat. Periksa kembali jadwal dan data Anda.',
            }),
        });
    };

    const resetAvailability = () => {
        setAvailable(null);
        setAvailabilityMessage('');
    };

    return (
        <UserShell active="booking" title={'Booking ' + facility.name} description={supportsBothModes && !selectedMode ? "Pilih mode booking terlebih dahulu, lalu tentukan jadwal yang sesuai." : "Pilih jadwal yang sesuai, cek ketersediaan, lalu lanjutkan pembayaran."}>
            <section className="booking-flow">
                <div className="booking-flow-summary">
                    <div className="booking-flow-image"><img src={facility.hero_image || facility.thumbnail || '/assets/ggm/Lapang Serba Guna (Basket)2 1.png'} alt={facility.name} /></div>
                    <div><span className="eyebrow"><i /> Venue pilihan</span><h2>{facility.name}</h2><p>{facility.subtitle || facility.venue_type}</p><div className="booking-flow-meta"><span><MapPin /> {facility.address || 'GGM Majalengka'}</span><span>{supportsBothModes && !selectedMode ? <><CalendarDays /> Pilih mode booking</> : daily ? <><CalendarDays /> Per hari</> : <><Clock3 /> Minimal {minimumHours} jam</>}</span></div><strong>
    {supportsBothModes && !selectedMode
        ? 'Pilih mode booking'
        : <>Rp {Number(daily ? facility.booking_price_per_day || 0 : facility.booking_price_per_hour || 0).toLocaleString('id-ID')} <small>{daily ? '/ hari' : '/ jam'}</small></>}
</strong></div>
                </div>

                <form onSubmit={submit} className="user-panel booking-form-panel" aria-busy={checking || form.processing}>
                    <ol className="booking-progress" aria-label="Tahapan booking"><li className="active"><span>1</span><strong>Jadwal</strong></li><li className={available === true ? 'active' : ''}><span>2</span><strong>Ketersediaan</strong></li><li><span>3</span><strong>Pembayaran</strong></li></ol>
                    <div className="user-panel-head"><div><span className="eyebrow"><i /> Detail pemesanan</span><h2>{supportsBothModes && !selectedMode ? 'Pilih mode booking' : daily ? 'Pilih rentang tanggal' : 'Pilih jadwal'}</h2><p>{supportsBothModes && !selectedMode ? 'Pilih per jam atau per hari untuk menampilkan field yang sesuai.' : daily ? 'Pilih satu atau beberapa hari. Jam tidak diperlukan untuk booking per hari.' : `Booking minimum ${minimumHours} jam. Harga dihitung berdasarkan durasi.`}</p></div><CalendarDays /></div>

                    {supportsBothModes && (
                        <div className="booking-mode-choice" role="group" aria-label="Pilih mode booking">
                            <span className="booking-mode-choice-label">Mode booking</span>
                            <div className="booking-mode-choice-options">
                                <button type="button" className={selectedMode === 'hourly' ? 'selected' : ''} onClick={() => { setSelectedMode('hourly'); form.setData('booking_mode', 'hourly'); resetAvailability(); }}>Per jam <small>Pilih jam &amp; durasi</small></button>
                                <button type="button" className={selectedMode === 'daily' ? 'selected' : ''} onClick={() => { setSelectedMode('daily'); form.setData('booking_mode', 'daily'); resetAvailability(); }}>Per hari <small>Pilih rentang tanggal</small></button>
                            </div>
                        </div>
                    )}

                    <div className={daily ? 'booking-step-grid booking-daily-grid' : 'booking-step-grid'}>
                        <label className={daily ? 'booking-date-range-field' : ''}>
                            {daily ? 'Rentang tanggal' : 'Tanggal'}
                            {daily ? <DateRangePicker mode="range" start={form.data.booking_date} end={form.data.booking_end_date} onChange={(start, end) => { form.setData('booking_date', start); form.setData('booking_end_date', end); resetAvailability(); }} /> : <DateRangePicker mode="single" start={form.data.booking_date} end="" minDate={toDateKey(new Date())} onChange={(date) => { form.setData('booking_date', date); resetAvailability(); }} />}
                            {daily && <small>Pilih tanggal mulai lalu tanggal selesai.</small>}
                        </label>

                        {hourly && <label htmlFor="booking-duration">
                            Durasi
                            <Select value={String(form.data.duration_minutes)} onValueChange={(value) => { form.setData('duration_minutes', Number(value)); form.setData('start_time', ''); setAvailable(null); }}>
                                <SelectTrigger id="booking-duration" className="user-select-trigger" aria-label="Durasi booking"><SelectValue placeholder="Pilih durasi" /></SelectTrigger>
                                <SelectContent>{durationOptions.map((minutes) => <SelectItem key={minutes} value={String(minutes)}>{minutes / 60} jam</SelectItem>)}</SelectContent>
                            </Select>
                            <small>Setelah durasi dipilih, pilihan waktu tersedia akan dimuat otomatis.</small>
                        </label>}
                        <label htmlFor="customer-phone">Nomor WhatsApp<input id="customer-phone" required placeholder="08xxxxxxxxxx" value={form.data.customer_phone} onChange={(e) => form.setData('customer_phone', e.target.value)} /><small>Digunakan untuk notifikasi booking.</small></label>
                    </div>

                    {hourly && form.data.booking_date && (
                        <section className="booking-slot-picker" aria-labelledby="booking-slot-title">
                            <div className="booking-slot-picker-head">
                                <div>
                                    <strong id="booking-slot-title">Pilih waktu yang tersedia</strong>
                                    <small>{checking ? 'Memuat pilihan waktu...' : availabilityMessage}</small>
                                </div>
                                <Clock3 aria-hidden="true" />
                            </div>
                            {!checking && hourlySlots.length > 0 && (
                                <div className="booking-slot-options">
                                    {hourlySlots.map((slot) => (
                                        <button key={slot.start_time} type="button" className={form.data.start_time === slot.start_time ? 'selected' : ''} onClick={() => selectHourlySlot(slot)}>
                                            <strong>{slot.label}</strong>
                                            <small>Rp {Number(slot.total || 0).toLocaleString('id-ID')}</small>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    <div className="booking-account-note"><CheckCircle2 /><div><strong>{user.name}</strong><span>{user.email}</span></div><small>Akun yang digunakan untuk booking</small></div>
                    <div className="booking-check-row">
                        {daily && <button type="button" className="button" onClick={checkDaily} disabled={checking || form.processing}>{checking ? 'Memeriksa...' : 'Cek ketersediaan'}</button>}
                        {available === true && <span role="status" className="booking-availability success"><CheckCircle2 /> {availabilityMessage}</span>}
                        {available === false && availabilityMessage && <span role="alert" className="booking-availability error">{availabilityMessage}</span>}
                    </div>
                    {available === true && <div className="booking-ready" role="status"><Info /><span>{daily ? `Rp ${Number(facility.booking_price_per_day || 0).toLocaleString('id-ID')} × ${Math.max(1, Math.round((parseDate(form.data.booking_end_date).getTime() - parseDate(form.data.booking_date).getTime()) / 86400000) + 1)} hari` : `Jadwal ${form.data.start_time} - ${hourlySlots.find((slot) => slot.start_time === form.data.start_time)?.end_time || ''}`}</span></div>}
                    <aside className="refund-policy-booking-hint" role="note">
                        <Info aria-hidden="true" />
                        <div>
                            <strong>Perhatikan ketentuan refund sebelum memesan</strong>
                            <p>Baca aturan pengembalian dana agar Anda memahami ketentuannya sebelum melanjutkan pembayaran.</p>
                            <Link href="/refund-policy" className="refund-policy-hint-link">Baca ketentuan refund</Link>
                        </div>
                    </aside>
                    {bookingError && <p className="form-error">{bookingError}</p>}
                    <button type="submit" disabled={form.processing || available !== true || !selectedMode || (hourly && !form.data.start_time)} className="button booking-submit booking-submit-inline"><CalendarCheck /> {form.processing ? 'Membuat booking...' : 'Buat booking & lanjutkan pembayaran'}</button>
                    <div className="booking-mobile-action-bar">
                        <button type="submit" disabled={form.processing || available !== true || !selectedMode || (hourly && !form.data.start_time)} className="button booking-submit booking-submit-floating">
                            <CalendarCheck aria-hidden="true" />
                            {form.processing ? 'Membuat booking...' : 'Buat booking & lanjutkan pembayaran'}
                        </button>
                    </div>
                </form>
            </section>
            <StatusDialog
                open={Boolean(status)}
                onOpenChange={(open) => !open && setStatus(null)}
                type={status?.type || 'error'}
                message={status?.message || ''}
            />
        </UserShell>
    );
}
