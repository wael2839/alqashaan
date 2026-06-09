import { type DashboardCalendarMode } from '@/components/dashboard-date-range-filter';
import { getDefaultRangeForMode } from '@/lib/dates';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export function useDashboardDefaultDateRange(calendarMode: DashboardCalendarMode) {
    const { hijriCalendarDefaults, gregorianCalendarDefaults } = usePage<SharedData>().props;

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const resolveRange = async () => {
            try {
                const range = await getDefaultRangeForMode(calendarMode, {
                    hijri: hijriCalendarDefaults,
                    gregorian: gregorianCalendarDefaults,
                });

                if (!cancelled) {
                    setFromDate(range.from);
                    setToDate(range.to);
                    setReady(true);
                }
            } catch {
                if (!cancelled) {
                    setReady(true);
                }
            }
        };

        void resolveRange();

        return () => {
            cancelled = true;
        };
    }, [calendarMode, gregorianCalendarDefaults, hijriCalendarDefaults]);

    return {
        fromDate,
        toDate,
        setFromDate,
        setToDate,
        ready,
        currentHijriYear: hijriCalendarDefaults?.current_hijri_year ?? null,
        currentGregorianYear: gregorianCalendarDefaults?.current_gregorian_year ?? null,
    };
}
