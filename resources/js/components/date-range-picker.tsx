import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function localDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function isoDate(date: Date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatRange(start: string, end: string) {
    if (!start) return 'Pilih rentang tanggal';
    const startDate = localDate(start);
    if (!end || start === end) return `${startDate.getDate()} ${shortMonthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
    const endDate = localDate(end);
    return `${startDate.getDate()} ${shortMonthNames[startDate.getMonth()]} ${startDate.getFullYear()} – ${endDate.getDate()} ${shortMonthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
}

function addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function DateRangePicker({
    start,
    end,
    mode = 'range',
    minDate,
    initialDate,
    onChange,
    disabled = false,
}: {
    start: string;
    end: string;
    mode?: 'range' | 'single';
    minDate?: string;
    initialDate?: string;
    onChange: (start: string, end: string) => void;
    disabled?: boolean;
}) {
    const today = startOfDay(new Date());
    const minimum = minDate ? startOfDay(localDate(minDate)) : today;
    const initialViewDate = initialDate ? startOfDay(localDate(initialDate)) : minimum;
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => (start ? localDate(start) : initialViewDate));
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClick = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    useEffect(() => {
        if (start) setViewDate(localDate(start));
    }, [start]);

    const calendarDays = useMemo(() => {
        const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const offset = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        return Array.from({ length: offset + daysInMonth }, (_, index) => index < offset ? null : new Date(viewDate.getFullYear(), viewDate.getMonth(), index - offset + 1));
    }, [viewDate]);

    const selectDate = (date: Date) => {
        const value = isoDate(date);

        if (mode === 'single') {
            onChange(value, '');
            setOpen(false);
            return;
        }
        if (!start || (start && end)) {
            onChange(value, '');
            return;
        }

        if (value < start) {
            onChange(value, start);
        } else {
            onChange(start, value);
            setOpen(false);
        }
    };

    const choosePreset = (preset: string) => {
        const base = today < minimum ? minimum : today;
        if (preset === 'today') {
            const value = isoDate(base);
            onChange(value, value);
        } else if (preset === 'tomorrow') {
            const value = isoDate(addDays(base, 1));
            onChange(value, value);
        } else if (preset === 'week') {
            onChange(isoDate(base), isoDate(addDays(base, 6)));
        } else if (preset === 'month') {
            const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);
            onChange(isoDate(base), isoDate(monthEnd));
        }
        setOpen(false);
    };

    const reset = () => {
        onChange('', '');
        setViewDate(initialViewDate);
    };

    return (
        <div className="date-range-picker" ref={ref}>
            <button
                type="button"
                className={`date-range-trigger ${open ? 'open' : ''}`}
                onClick={() => setOpen((value) => !value)}
                disabled={disabled}
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                <span>{mode === 'single' ? (start ? `${localDate(start).getDate()} ${shortMonthNames[localDate(start).getMonth()]} ${localDate(start).getFullYear()}` : 'Pilih tanggal') : formatRange(start, end)}</span>
                <ChevronDown className={`date-range-trigger-chevron ${open ? 'rotated' : ''}`} aria-hidden="true" />
            </button>

            {open && (
                <>
                    <button
                        type="button"
                        className="date-range-backdrop"
                        aria-label="Tutup kalender"
                        onClick={() => setOpen(false)}
                    />
                    <div className="date-range-popover" role="dialog" aria-label={mode === 'single' ? 'Pilih tanggal' : 'Pilih rentang tanggal'}>
                    <div className="date-range-presets">
                        <button type="button" onClick={() => choosePreset('today')}>Hari ini</button>
                        <button type="button" onClick={() => choosePreset('tomorrow')}>Besok</button>
                        {mode === 'range' && <>
                            <button type="button" onClick={() => choosePreset('week')}>Minggu ini</button>
                            <button type="button" onClick={() => choosePreset('month')}>Bulan ini</button>
                        </>}
                        <button type="button" className="reset" onClick={reset}><RotateCcw aria-hidden="true" /> Reset</button>
                    </div>

                    <div className="date-range-calendar">
                        <div className="date-range-calendar-head">
                            <strong>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                    disabled={viewDate.getFullYear() === minimum.getFullYear() && viewDate.getMonth() === minimum.getMonth()}
                                    aria-label="Bulan sebelumnya"
                                >
                                    <ChevronLeft aria-hidden="true" />
                                </button>
                                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} aria-label="Bulan berikutnya">
                                    <ChevronRight aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                        <div className="date-range-weekdays">
                            {weekDays.map((day) => <span key={day}>{day}</span>)}
                        </div>
                        <div className="date-range-grid">
                            {calendarDays.map((date, index) => {
                                if (!date) return <span key={`empty-${index}`} className="date-range-empty" />;
                                const value = isoDate(date);
                                const disabledDate = date < minimum;
                                const selectedStart = value === start;
                                const selectedEnd = value === end;
                                const inRange = Boolean(start && end && value > start && value < end);
                                return (
                                    <button
                                        type="button"
                                        key={value}
                                        className={[
                                            'date-range-day',
                                            selectedStart ? 'selected-start' : '',
                                            selectedEnd ? 'selected-end' : '',
                                            inRange ? 'in-range' : '',
                                        ].filter(Boolean).join(' ')}
                                        disabled={disabledDate}
                                        onClick={() => selectDate(date)}
                                        aria-pressed={selectedStart || selectedEnd}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="date-range-helper">
                            {mode === 'single' ? 'Pilih tanggal booking' : start && !end ? 'Pilih tanggal selesai' : 'Pilih rentang tanggal penggunaan venue'}
                        </p>
                    </div>
                    </div>
                </>
            )}
        </div>
    );
}
