import { FormEvent, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { CalendarCheck, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Info, MapPin } from 'lucide-react';
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

const formatRange = (start: string, end: string) => {
    if (!start) return 'Pilih rentang tanggal';
    const formatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return end ? `${formatter.format(parseDate(start))} – ${formatter.format(parseDate(end))}` : `${formatter.format(parseDate(start))} – pilih tanggal akhir`;
};

function DateRangePicker({ start, end, onChange }: { start: string; end: string; onChange: (start: string, end: string) => void }) {
    const today = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }, []);
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState(() => start ? parseDate(start) : today);
    const [selectingEnd, setSelectingEnd] = useState(Boolean(start && !end));

    const cells = useMemo(() => {
        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const firstWeekday = (first.getDay() + 6) % 7;
        const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const previousDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
        return Array.from({ length: 42 }, (_, index) => {
            const dayNumber = index - firstWeekday + 1;
            if (dayNumber < 1) return new Date(month.getFullYear(), month.getMonth() - 1, previousDays + dayNumber);
            if (dayNumber > days) return new Date(month.getFullYear(), month.getMonth() + 1, dayNumber - days);
            return new Date(month.getFullYear(), month.getMonth(), dayNumber);
        });
    }, [month]);

    const choose = (date: Date) => {
        if (date < today) return;
        const key = toDateKey(date);
        if (!start || (start && end) || selectingEnd === false) {
            onChange(key, '');
            setSelectingEnd(true);
            return;
        }
        if (key < start) {
            onChange(key, '');
            setSelectingEnd(true);
            return;
        }
        onChange(start, key);
        setSelectingEnd(false);
        setOpen(false);
    };

    return (
        <div className="date-range-picker">
            <button type="button" className="date-range-trigger" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
                <CalendarDays aria-hidden="true" />
                <span>{formatRange(start, end)}</span>
                <ChevronRight aria-hidden="true" className={open ? 'date-range-chevron open' : 'date-range-chevron'} />
            </button>
            {open && (
                <div className="date-range-popover" role="dialog" aria-label="Pilih rentang tanggal">
                    <div className="date-range-shortcuts">
                        <strong>Rentang tanggal</strong>
                        <button type="button" onClick={() => { const value = toDateKey(today); onChange(value, value); setSelectingEnd(false); setOpen(false); }}>Hari ini</button>
                        <button type="button" onClick={() => { const value = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)); onChange(value, value); setSelectingEnd(false); setOpen(false); }}>Besok</button>
                        <button type="button" onClick={() => { onChange('', ''); setSelectingEnd(false); }}>Reset</button>
                    </div>
                    <div className="date-range-calendar">
                        <div className="date-range-calendar-head">
                            <strong>{new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(month)}</strong>
                            <div><button type="button" aria-label="Bulan sebelumnya" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><button type="button" aria-label="Bulan berikutnya" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div>
                        </div>
                        <div className="date-range-weekdays">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => <span key={day}>{day}</span>)}</div>
                        <div className="date-range-grid">
                            {cells.map((date) => {
                                const key = toDateKey(date);
                                const outside = date.getMonth() !== month.getMonth();
                                const disabled = date < today;
                                const selected = key === start || key === end;
                                const inRange = Boolean(start && end && key > start && key < end);
                                return <button key={key} type="button" disabled={disabled} className={['date-range-day', outside ? 'outside' : '', selected ? 'selected' : '', inRange ? 'in-range' : ''].filter(Boolean).join(' ')} onClick={() => choose(date)}>{date.getDate()}</button>;
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Booking({ facility, user }: { facility: any; user: { name: string; email: string } }) {
    const supportsBothModes = facility.booking_mode === 'both';
    const [selectedMode, setSelectedMode] = useState<'hourly' | 'daily' | ''>(supportsBothModes ? '' : ((facility.booking_mode || 'hourly') as 'hourly' | 'daily'));
    const daily = selectedMode === 'daily';
    const hourly = selectedMode === 'hourly';
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
        booking_mode: selectedMode,
    });

    const durationOptions = useMemo(() => {
        const options: number[] = [];
        for (let minutes = minimumHours * 60; minutes <= 720; minutes += 30) options.push(minutes);
        return options;
    }, [minimumHours]);

    const check = async () => {
        if (!selectedMode) {
            setAvailabilityMessage('Pilih mode booking per jam atau per hari terlebih dahulu.');
            setAvailable(false);
            return;
        }
        if (daily && (!form.data.booking_date || !form.data.booking_end_date)) {
            setAvailabilityMessage('Pilih tanggal mulai dan tanggal akhir terlebih dahulu.');
            setAvailable(false);
            return;
        }
        if (!daily && (!form.data.booking_date || !form.data.start_time)) {
            setAvailabilityMessage('Pilih tanggal dan jam mulai terlebih dahulu.');
            setAvailable(false);
            return;
        }

        setChecking(true);
        setAvailabilityMessage('');
        try {
            const params = new URLSearchParams({ booking_date: form.data.booking_date, booking_mode: selectedMode });
            if (daily) params.set('booking_end_date', form.data.booking_end_date);
            else {
                params.set('start_time', form.data.start_time);
                params.set('duration_minutes', String(form.data.duration_minutes));
            }
            const response = await fetch('/booking/' + facility.slug + '/availability?' + params.toString(), { headers: { Accept: 'application/json' } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ketersediaan venue belum dapat diperiksa.');
            setAvailable(Boolean(data.available));
            setAvailabilityMessage(data.available ? (daily ? `Rentang ${data.days} hari tersedia.` : 'Slot tersedia. Kamu bisa melanjutkan booking.') : 'Slot sudah terisi. Silakan pilih waktu lain.');
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
        if (!selectedMode) return;
        form.post('/booking/' + facility.slug);
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
                    <div><span className="eyebrow"><i /> Venue pilihan</span><h2>{facility.name}</h2><p>{facility.subtitle || facility.venue_type}</p><div className="booking-flow-meta"><span><MapPin /> {facility.address || 'GGM Majalengka'}</span><span>{daily ? <><CalendarDays /> Per hari</> : <><Clock3 /> Minimal {minimumHours} jam</>}</span></div><strong>Rp {Number(daily ? facility.booking_price_per_day || 0 : facility.booking_price_per_hour || 0).toLocaleString('id-ID')} <small>{daily ? '/ hari' : '/ jam'}</small></strong></div>
                </div>

                <form onSubmit={submit} className="user-panel booking-form-panel" aria-busy={checking || form.processing}>
                    <ol className="booking-progress" aria-label="Tahapan booking"><li className="active"><span>1</span><strong>Jadwal</strong></li><li className={available === true ? 'active' : ''}><span>2</span><strong>Ketersediaan</strong></li><li><span>3</span><strong>Pembayaran</strong></li></ol>
                    <div className="user-panel-head"><div><span className="eyebrow"><i /> Detail pemesanan</span><h2>{daily ? 'Pilih rentang tanggal' : 'Pilih jadwal'}</h2><p>{daily ? 'Pilih satu atau beberapa hari. Jam tidak diperlukan untuk booking per hari.' : `Booking minimum ${minimumHours} jam. Harga dihitung berdasarkan durasi.`}</p></div><CalendarDays /></div>

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
                            {daily ? <DateRangePicker start={form.data.booking_date} end={form.data.booking_end_date} onChange={(start, end) => { form.setData('booking_date', start); form.setData('booking_end_date', end); resetAvailability(); }} /> : <input id="booking-date" required type="date" min={toDateKey(new Date())} value={form.data.booking_date} onChange={(e) => { form.setData('booking_date', e.target.value); resetAvailability(); }} />}
                            {daily && <small>Pilih tanggal mulai lalu tanggal selesai.</small>}
                        </label>

                        {hourly && <label htmlFor="booking-start-time">Jam mulai<input id="booking-start-time" required type="time" value={form.data.start_time} onChange={(e) => { form.setData('start_time', e.target.value); resetAvailability(); }} /></label>}
                        {hourly && <label htmlFor="booking-duration">Durasi<Select value={String(form.data.duration_minutes)} onValueChange={(value) => { form.setData('duration_minutes', Number(value)); resetAvailability(); }}><SelectTrigger id="booking-duration" className="user-select-trigger" aria-label="Durasi booking"><SelectValue placeholder="Pilih durasi" /></SelectTrigger><SelectContent>{durationOptions.map((minutes) => <SelectItem key={minutes} value={String(minutes)}>{minutes / 60} jam</SelectItem>)}</SelectContent></Select></label>}
                        <label htmlFor="customer-phone">Nomor WhatsApp<input id="customer-phone" required placeholder="08xxxxxxxxxx" value={form.data.customer_phone} onChange={(e) => form.setData('customer_phone', e.target.value)} /><small>Digunakan untuk notifikasi booking.</small></label>
                    </div>

                    <div className="booking-account-note"><CheckCircle2 /><div><strong>{user.name}</strong><span>{user.email}</span></div><small>Akun yang digunakan untuk booking</small></div>
                    <div className="booking-check-row"><button type="button" className="button" onClick={check} disabled={checking || form.processing}>{checking ? 'Memeriksa...' : 'Cek ketersediaan'}</button>{available === true && <span role="status" className="booking-availability success"><CheckCircle2 /> {availabilityMessage}</span>}{available === false && availabilityMessage && <span role="alert" className="booking-availability error">{availabilityMessage}</span>}</div>
                    {available === true && <div className="booking-ready" role="status"><Info /><span>{daily ? `Rp ${Number(facility.booking_price_per_day || 0).toLocaleString('id-ID')} × ${Math.max(1, Math.round((parseDate(form.data.booking_end_date).getTime() - parseDate(form.data.booking_date).getTime()) / 86400000) + 1)} hari` : availabilityMessage}</span></div>}
                    {bookingError && <p className="form-error">{bookingError}</p>}
                    <button type="submit" disabled={form.processing || available !== true || !selectedMode} className="button booking-submit"><CalendarCheck /> {form.processing ? 'Membuat booking...' : 'Buat booking & lanjutkan pembayaran'}</button>
                </form>
            </section>
        </UserShell>
    );
}
