import api from '@/lib/api';

export interface HijriParts {
    year: number;
    month: number;
    day: number;
}

const gregorianMonthCache = new Map<string, Map<string, HijriParts>>();
const hijriToGregorianCache = new Map<string, string>();
const hijriYearBoundsCache = new Map<number, { from: string; to: string }>();
let defaultsPromise: Promise<{
    current_hijri_year: number;
    current_gregorian_year: number;
    hijri_default_range: { from: string; to: string };
    gregorian_default_range: { from: string; to: string };
}> | null = null;

function hijriKey(year: number, month: number, day: number): string {
    return `${year}-${month}-${day}`;
}

function cacheHijriMapping(gregorian: string, hijri: HijriParts): void {
    hijriToGregorianCache.set(hijriKey(hijri.year, hijri.month, hijri.day), gregorian);
}

export async function loadGregorianMonth(yearMonth: string): Promise<Map<string, HijriParts>> {
    const cached = gregorianMonthCache.get(yearMonth);

    if (cached) {
        return cached;
    }

    const response = await api.get<{
        data: {
            month: string;
            days: Array<{ date: string; hijri: HijriParts }>;
        };
    }>('/calendar/gregorian-month', { params: { month: yearMonth } });

    const map = new Map<string, HijriParts>();

    for (const day of response.data.data.days) {
        map.set(day.date, day.hijri);
        cacheHijriMapping(day.date, day.hijri);
    }

    gregorianMonthCache.set(yearMonth, map);

    return map;
}

export async function gregorianToHijriOfficial(isoDate: string): Promise<HijriParts> {
    const yearMonth = isoDate.slice(0, 7);
    const month = await loadGregorianMonth(yearMonth);
    const hijri = month.get(isoDate);

    if (!hijri) {
        throw new Error(`Unable to resolve official Hijri date for ${isoDate}`);
    }

    return hijri;
}

export async function hijriToGregorianOfficial(year: number, month: number, day: number): Promise<string> {
    const key = hijriKey(year, month, day);
    const cached = hijriToGregorianCache.get(key);

    if (cached) {
        return cached;
    }

    const response = await api.get<{
        data: {
            gregorian: string;
            hijri: HijriParts;
        };
    }>('/calendar/hijri-to-gregorian', {
        params: { year, month, day },
    });

    const gregorian = response.data.data.gregorian;
    cacheHijriMapping(gregorian, response.data.data.hijri);

    return gregorian;
}

export async function getOfficialHijriYearBounds(year: number): Promise<{ from: string; to: string }> {
    const cached = hijriYearBoundsCache.get(year);

    if (cached) {
        return cached;
    }

    const response = await api.get<{
        data: {
            year: number;
            from: string;
            to: string;
        };
    }>('/calendar/hijri-year-bounds', { params: { year } });

    const bounds = {
        from: response.data.data.from,
        to: response.data.data.to,
    };

    hijriYearBoundsCache.set(year, bounds);

    return bounds;
}

export async function getOfficialDefaultDashboardRange(): Promise<{ from: string; to: string }> {
    if (!defaultsPromise) {
        defaultsPromise = api.get<{
            data: {
                current_hijri_year: number;
                current_gregorian_year: number;
                hijri_default_range: { from: string; to: string };
                gregorian_default_range: { from: string; to: string };
            };
        }>('/calendar/defaults').then((response) => response.data.data);
    }

    const defaults = await defaultsPromise;

    return defaults.hijri_default_range;
}

export function formatHijriParts(hijri: HijriParts): string {
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${pad(hijri.day)}/${pad(hijri.month)}/${hijri.year}`;
}

export function primeGregorianMonth(yearMonth: string, days: Array<{ date: string; hijri: HijriParts | null }>): void {
    const map = new Map<string, HijriParts>();

    for (const day of days) {
        if (!day.hijri) {
            continue;
        }

        map.set(day.date, day.hijri);
        cacheHijriMapping(day.date, day.hijri);
    }

    gregorianMonthCache.set(yearMonth, map);
}
