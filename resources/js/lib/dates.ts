import { toGregorian, toHijri } from 'hijri-converter';

const LATIN_NUMBER_FORMAT = 'ar-SA-u-nu-latn';

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

export function toIsoDate(year: number, month: number, day: number): string {
    return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseIsoDate(date: string): { year: number; month: number; day: number } {
    const [year, month, day] = date.split('-').map(Number);

    return { year, month, day };
}

export function gregorianToHijriParts(date: string): { hy: number; hm: number; hd: number } {
    const { year, month, day } = parseIsoDate(date);

    return toHijri(year, month, day);
}

export function hijriToGregorianIso(hy: number, hm: number, hd: number): string {
    const gregorian = toGregorian(hy, hm, hd);

    return toIsoDate(gregorian.gy, gregorian.gm, gregorian.gd);
}

export function getGregorianYearBounds(year: number): { from: string; to: string } {
    return {
        from: toIsoDate(year, 1, 1),
        to: toIsoDate(year, 12, 31),
    };
}

export function getCurrentHijriYear(): number {
    const now = new Date();

    return gregorianToHijriParts(toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())).hy;
}

export function getHijriYearBounds(hy: number): { from: string; to: string } {
    const from = hijriToGregorianIso(hy, 1, 1);
    const nextYearStart = parseIsoDate(hijriToGregorianIso(hy + 1, 1, 1));
    const end = new Date(nextYearStart.year, nextYearStart.month - 1, nextYearStart.day);
    end.setDate(end.getDate() - 1);

    return {
        from,
        to: toIsoDate(end.getFullYear(), end.getMonth() + 1, end.getDate()),
    };
}

export function getDefaultDashboardDateRange(): { from: string; to: string } {
    return getHijriYearBounds(getCurrentHijriYear());
}

export function formatDateRangeLabel(fromDate: string, toDate: string): { gregorian: string; hijri: string } {
    return {
        gregorian: `${formatGregorianDate(fromDate)} — ${formatGregorianDate(toDate)}`,
        hijri: `${formatHijriDate(fromDate)} — ${formatHijriDate(toDate)}`,
    };
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(LATIN_NUMBER_FORMAT, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options,
    }).format(value);
}

export function formatInteger(value: number): string {
    return formatNumber(value, { maximumFractionDigits: 0 });
}

export function formatGregorianDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);

    return `${pad(day)}/${pad(month)}/${year}`;
}

export function formatHijriDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    const hijri = toHijri(year, month, day);

    return `${pad(hijri.hd)}/${pad(hijri.hm)}/${hijri.hy} هـ`;
}

export function formatDualDate(date: string): { gregorian: string; hijri: string } {
    return {
        gregorian: formatGregorianDate(date),
        hijri: formatHijriDate(date),
    };
}

export function formatMonthYear(date: Date): string {
    return `${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatChartMonthLabel(month: string, calendarMode: 'gregorian' | 'hijri' = 'gregorian'): string {
    const [year, monthNum] = month.split('-').map(Number);
    const isoMid = toIsoDate(year, monthNum, 15);

    if (calendarMode === 'hijri') {
        const hijri = gregorianToHijriParts(isoMid);

        return `${pad(hijri.hm)}/${hijri.hy}`;
    }

    return `${pad(monthNum)}/${year}`;
}

export function formatCompactCurrency(amount: number): string {
    if (Math.abs(amount) >= 1_000_000) {
        return `${formatNumber(amount / 1_000_000, { maximumFractionDigits: 1 })}M`;
    }

    if (Math.abs(amount) >= 1_000) {
        return `${formatNumber(amount / 1_000, { maximumFractionDigits: 1 })}K`;
    }

    return formatNumber(amount, { maximumFractionDigits: 0 });
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat(LATIN_NUMBER_FORMAT, {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export const BOOKING_TYPE_LABELS: Record<string, string> = {
    full: 'كامل',
    men: 'رجال',
    women: 'نساء',
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
    active: 'نشط',
    completed: 'مكتمل',
    cancelled: 'ملغى',
};

export function bookingStatusBadgeClass(status: string): string {
    switch (status) {
        case 'active':
            return 'badge-active';
        case 'completed':
            return 'badge-completed';
        case 'cancelled':
            return 'badge-cancelled';
        default:
            return 'badge-type';
    }
}
