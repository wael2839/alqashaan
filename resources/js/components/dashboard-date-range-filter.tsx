import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    formatDateRangeLabel,
    gregorianToHijriParts,
    hijriToGregorianIso,
    parseIsoDate,
    toIsoDate,
} from '@/lib/dates';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export type DashboardCalendarMode = 'gregorian' | 'hijri';

interface DashboardDateRangeFilterProps {
    fromDate: string;
    toDate: string;
    calendarMode: DashboardCalendarMode;
    onFromDateChange: (isoDate: string) => void;
    onToDateChange: (isoDate: string) => void;
    onCalendarModeChange: (mode: DashboardCalendarMode) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const DAYS = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0'));

const selectTriggerClass = 'h-11 w-full';

function DateField({
    label,
    value,
    calendarMode,
    onChange,
}: {
    label: string;
    value: string;
    calendarMode: DashboardCalendarMode;
    onChange: (isoDate: string) => void;
}) {
    const gregorian = parseIsoDate(value);
    const hijri = gregorianToHijriParts(value);
    const parts =
        calendarMode === 'gregorian'
            ? { day: gregorian.day, month: gregorian.month, year: gregorian.year }
            : { day: hijri.hd, month: hijri.hm, year: hijri.hy };

    const yearOptions = useMemo(() => {
        const center = calendarMode === 'gregorian' ? gregorian.year : hijri.hy;

        return Array.from({ length: 21 }, (_, index) => center - 10 + index);
    }, [calendarMode, gregorian.year, hijri.hy]);

    const update = (field: 'day' | 'month' | 'year', raw: string) => {
        const next = {
            day: field === 'day' ? Number(raw) : parts.day,
            month: field === 'month' ? Number(raw) : parts.month,
            year: field === 'year' ? Number(raw) : parts.year,
        };

        if (calendarMode === 'gregorian') {
            onChange(toIsoDate(next.year, next.month, next.day));
            return;
        }

        onChange(hijriToGregorianIso(next.year, next.month, next.day));
    };

    return (
        <div className="min-w-[220px] flex-1 space-y-2">
            <Label>{label}</Label>
            <div className="grid grid-cols-3 gap-2">
                <Select value={String(parts.day).padStart(2, '0')} onValueChange={(day) => update('day', day)}>
                    <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="يوم" />
                    </SelectTrigger>
                    <SelectContent>
                        {DAYS.map((day) => (
                            <SelectItem key={day} value={day}>
                                {day}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={String(parts.month).padStart(2, '0')} onValueChange={(month) => update('month', month)}>
                    <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="شهر" />
                    </SelectTrigger>
                    <SelectContent>
                        {MONTHS.map((month) => (
                            <SelectItem key={month} value={month}>
                                {month}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={String(parts.year)} onValueChange={(year) => update('year', year)}>
                    <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="سنة" />
                    </SelectTrigger>
                    <SelectContent>
                        {yearOptions.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

export function DashboardDateRangeFilter({
    fromDate,
    toDate,
    calendarMode,
    onFromDateChange,
    onToDateChange,
    onCalendarModeChange,
}: DashboardDateRangeFilterProps) {
    const rangeLabel = formatDateRangeLabel(fromDate, toDate);

    return (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <div className="space-y-2 lg:w-36">
                    <Label>نوع التقويم</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant={calendarMode === 'gregorian' ? 'default' : 'outline'}
                            className="h-11"
                            onClick={() => onCalendarModeChange('gregorian')}
                        >
                            ميلادي
                        </Button>
                        <Button
                            type="button"
                            variant={calendarMode === 'hijri' ? 'default' : 'outline'}
                            className="h-11"
                            onClick={() => onCalendarModeChange('hijri')}
                        >
                            هجري
                        </Button>
                    </div>
                </div>

                <DateField label="من تاريخ" value={fromDate} calendarMode={calendarMode} onChange={onFromDateChange} />
                <DateField label="إلى تاريخ" value={toDate} calendarMode={calendarMode} onChange={onToDateChange} />
            </div>

            <p className={cn('meta-text border-t border-border pt-3')}>
                {rangeLabel.gregorian} — {rangeLabel.hijri}
            </p>
        </div>
    );
}
