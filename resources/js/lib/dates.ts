import {
    formatHijriParts,
    getOfficialDefaultDashboardRange,
    getOfficialHijriYearBounds,
    gregorianToHijriOfficial,
    hijriToGregorianOfficial,
    type HijriParts,
} from '@/lib/saudi-hijri-calendar';

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

export type { HijriParts };

export async function gregorianToHijriParts(date: string): Promise<HijriParts> {
    return gregorianToHijriOfficial(date);
}

export async function hijriToGregorianIso(hy: number, hm: number, hd: number): Promise<string> {
    return hijriToGregorianOfficial(hy, hm, hd);
}

export function getGregorianYearBounds(year: number): { from: string; to: string } {
    return {
        from: toIsoDate(year, 1, 1),
        to: toIsoDate(year, 12, 31),
    };
}

export async function getCurrentHijriYear(): Promise<number> {
    const now = new Date();
    const hijri = await gregorianToHijriOfficial(toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate()));

    return hijri.year;
}

export async function getHijriYearBounds(hy: number): Promise<{ from: string; to: string }> {
    return getOfficialHijriYearBounds(hy);
}

export async function getDefaultDashboardDateRange(): Promise<{ from: string; to: string }> {
    return getOfficialDefaultDashboardRange();
}

export async function getDefaultRangeForMode(
    mode: 'gregorian' | 'hijri',
    shared?: {
        hijri?: {
            current_hijri_year: number;
            default_range: { from: string; to: string };
        } | null;
        gregorian?: {
            current_gregorian_year: number;
            default_range: { from: string; to: string };
        } | null;
    },
): Promise<{ from: string; to: string }> {
    if (mode === 'gregorian') {
        if (shared?.gregorian?.default_range) {
            return shared.gregorian.default_range;
        }

        return getGregorianYearBounds(new Date().getFullYear());
    }

    if (shared?.hijri?.default_range) {
        return shared.hijri.default_range;
    }

    return getDefaultDashboardDateRange();
}

export function formatDateRangeLabel(
    fromDate: string,
    toDate: string,
    fromHijri?: HijriParts | null,
    toHijri?: HijriParts | null,
): { gregorian: string; hijri: string } {
    return {
        gregorian: `${formatGregorianDate(fromDate)} — ${formatGregorianDate(toDate)}`,
        hijri: `${formatHijriDate(fromDate, fromHijri)} — ${formatHijriDate(toDate, toHijri)}`,
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

export function formatContractNumber(value: string | null | undefined): string {
    const trimmed = (value ?? '').trim();

    return trimmed === '' ? '0' : trimmed;
}

export function contractNumberForForm(value: string | null | undefined): string {
    return (value ?? '').trim();
}

const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] as const;

export function formatArabicWeekday(date: string): string {
    const { year, month, day } = parseIsoDate(date);

    return ARABIC_WEEKDAYS[new Date(year, month - 1, day).getDay()];
}

export function formatGregorianDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);

    return `${pad(day)}/${pad(month)}/${year}`;
}

export function formatHijriDate(date: string, hijri?: HijriParts | null): string {
    if (hijri) {
        return formatHijriParts(hijri);
    }

    return '...';
}

export function formatDualDate(date: string, hijri?: HijriParts | null): { weekday: string; gregorian: string; hijri: string } {
    return {
        weekday: formatArabicWeekday(date),
        gregorian: formatGregorianDate(date),
        hijri: formatHijriDate(date, hijri),
    };
}

export function formatBookingDayStatus(isPast: boolean, available: boolean, bookedSummary?: string): string {
    if (isPast) {
        return 'تاريخ سابق';
    }

    if (available) {
        return 'متاح للحجز';
    }

    if (bookedSummary) {
        return `محجوز لـ ${bookedSummary}`;
    }

    return 'غير متاح للحجز';
}

export function formatMonthYear(date: Date): string {
    return `${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export async function formatChartMonthLabel(
    month: string,
    calendarMode: 'gregorian' | 'hijri' = 'gregorian',
): Promise<string> {
    const [year, monthNum] = month.split('-').map(Number);
    const isoMid = toIsoDate(year, monthNum, 15);

    if (calendarMode === 'hijri') {
        const hijri = await gregorianToHijriOfficial(isoMid);

        return `${pad(hijri.month)}/${hijri.year}`;
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
