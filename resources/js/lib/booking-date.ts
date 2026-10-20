export type BookingDateValue = string | null | undefined;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse a database date without letting the browser timezone shift the day.
 * Laravel may serialize date values as YYYY-MM-DD or as an ISO timestamp.
 */
export function parseBookingDate(value: BookingDateValue): Date | null {
    if (typeof value !== 'string' || !value.trim()) return null;

    const match = value.trim().slice(0, 10).match(DATE_ONLY_PATTERN);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year
        || date.getUTCMonth() !== month - 1
        || date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

export function formatBookingDate(
    value: BookingDateValue,
    options: Intl.DateTimeFormatOptions = {},
    fallback = 'Tanggal belum tersedia',
): string {
    const date = parseBookingDate(value);
    if (!date) return fallback;

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...options,
        timeZone: 'UTC',
    }).format(date);
}

export function getBookingDayCount(startValue: BookingDateValue, endValue: BookingDateValue): number | null {
    const start = parseBookingDate(startValue);
    const end = parseBookingDate(endValue);

    if (!start || !end || end.getTime() < start.getTime()) return null;

    return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}
