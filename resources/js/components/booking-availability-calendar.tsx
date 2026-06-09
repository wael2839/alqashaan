import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookingsApi, type BookedSlot } from '@/lib/api';
import {
    BOOKING_TYPE_LABELS,
    formatBookingDayStatus,
    formatDualDate,
    formatInteger,
} from '@/lib/dates';
import { primeGregorianMonth, type HijriParts } from '@/lib/saudi-hijri-calendar';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خم', 'جمع', 'سب'];

const MONTHS = Array.from({ length: 12 }, (_, index) => {
    const value = String(index + 1);
    return { value, label: value.padStart(2, '0') };
});

const DAY_CELL_CLASS = 'size-10';

interface DayAvailability {
    available: boolean;
    bookings: BookedSlot[];
    hijri?: HijriParts | null;
}


function toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(year, month - 1, day);
}

function formatIso(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function isPastDate(dateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return parseDate(dateStr) < today;
}

function formatBookedSlots(bookings: BookedSlot[]): string {
    return bookings.map((booking) => `${booking.customer_name} (${BOOKING_TYPE_LABELS[booking.type]})`).join(' — ');
}

export function BookingAvailabilityCalendar() {
    const [viewDate, setViewDate] = useState(() => new Date());
    const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
    const [loading, setLoading] = useState(false);
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const monthKey = toMonthKey(viewDate);
    const todayStr = formatIso(new Date());

    const loadAvailability = useCallback(() => {
        setLoading(true);

        bookingsApi
            .availability({ month: monthKey, type: 'full' })
            .then((data) => {
                const map: Record<string, DayAvailability> = {};

                data.dates.forEach((day) => {
                    map[day.date] = {
                        available: day.available,
                        bookings: day.bookings,
                        hijri: day.hijri,
                    };
                });

                primeGregorianMonth(monthKey, data.dates);
                setAvailability(map);
            })
            .finally(() => setLoading(false));
    }, [monthKey]);

    useEffect(() => {
        loadAvailability();
    }, [loadAvailability]);

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const days: { date: string; inMonth: boolean }[] = [];

        for (let index = startPadding - 1; index >= 0; index--) {
            days.push({ date: formatIso(new Date(year, month, -index)), inMonth: false });
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push({ date: formatIso(new Date(year, month, day)), inMonth: true });
        }

        let nextDay = 1;

        while (days.length % 7 !== 0) {
            days.push({ date: formatIso(new Date(year, month + 1, nextDay)), inMonth: false });
            nextDay++;
        }

        return days;
    }, [viewDate]);

    const monthStats = useMemo(() => {
        let available = 0;
        let booked = 0;
        let past = 0;

        calendarDays.forEach(({ date, inMonth }) => {
            if (!inMonth) {
                return;
            }

            const info = availability[date];

            if (!info) {
                return;
            }

            if (isPastDate(date)) {
                past++;
                return;
            }

            if (info.available) {
                available++;
                return;
            }

            booked++;
        });

        return { available, booked, past };
    }, [availability, calendarDays]);

    const goMonth = (delta: number) => {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
        setHoveredDate(null);
        setSelectedDate(null);
    };

    const minYear = new Date().getFullYear();
    const yearOptions = useMemo(() => Array.from({ length: 16 }, (_, index) => minYear + index), [minYear]);

    const activeInfoDate = hoveredDate ?? selectedDate;
    const activeDayInfo = activeInfoDate ? availability[activeInfoDate] : null;
    const activeDayDates = activeInfoDate && activeDayInfo ? formatDualDate(activeInfoDate, activeDayInfo.hijri) : null;
    const activeDayIsPast = activeInfoDate ? isPastDate(activeInfoDate) : false;
    const activeDayIsAvailable = Boolean(activeDayInfo?.available && activeInfoDate && !activeDayIsPast);

    const handleDayClick = (dateStr: string, inMonth: boolean) => {
        if (!inMonth) {
            return;
        }

        setSelectedDate(dateStr);
    };

    return (
        <div className="mx-auto w-fit max-w-full space-y-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="icon" className="size-8 shrink-0" onClick={() => goMonth(-1)}>
                        <ChevronRight className="size-3.5" />
                    </Button>
                    <div className="grid flex-1 grid-cols-2 gap-1.5">
                        <Select value={String(viewDate.getMonth() + 1)} onValueChange={(month) => setViewDate((prev) => new Date(prev.getFullYear(), Number(month) - 1, 1))}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="الشهر" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((month) => (
                                    <SelectItem key={month.value} value={month.value}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={String(viewDate.getFullYear())} onValueChange={(year) => setViewDate((prev) => new Date(Number(year), prev.getMonth(), 1))}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="السنة" />
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
                    <Button type="button" variant="outline" size="icon" className="size-8 shrink-0" onClick={() => goMonth(1)}>
                        <ChevronLeft className="size-3.5" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground sm:justify-end">
                    <span className="rounded-full bg-muted px-2 py-1">
                        متاح: <span className="font-semibold text-foreground">{formatInteger(monthStats.available)}</span>
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1">
                        محجوز: <span className="font-semibold text-foreground">{formatInteger(monthStats.booked)}</span>
                    </span>
                </div>
            </div>

            <div
                className={cn(
                    'min-h-[3rem] rounded-lg px-2.5 py-2 text-center text-xs leading-snug transition-all duration-200 ease-in-out',
                    activeInfoDate && activeDayInfo
                        ? activeDayInfo.available && !isPastDate(activeInfoDate)
                            ? 'calendar-info-available'
                            : isPastDate(activeInfoDate)
                              ? 'calendar-info-past'
                              : 'calendar-info-booked'
                        : 'calendar-info-empty border border-dashed',
                )}
            >
                {activeDayDates && activeDayInfo ? (
                    <div className="space-y-1">
                        <p>
                            {activeDayDates.gregorian} · {activeDayDates.hijri}
                        </p>
                        <p>
                            {formatBookingDayStatus(
                                activeDayIsPast,
                                activeDayIsAvailable,
                                activeDayInfo.bookings.length > 0 ? formatBookedSlots(activeDayInfo.bookings) : undefined,
                            )}
                        </p>
                    </div>
                ) : (
                    'مرّر أو اضغط على يوم لعرض التوفر'
                )}
            </div>

            <div className="grid w-fit grid-cols-7 gap-1.5">
                {WEEKDAYS.map((day) => (
                    <div key={day} className={cn(DAY_CELL_CLASS, 'flex items-center justify-center text-[10px] font-medium text-muted-foreground')}>
                        {day}
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : (
                <div className="grid w-fit grid-cols-7 gap-1.5">
                    {calendarDays.map(({ date, inMonth }) => {
                        if (!inMonth) {
                            return <div key={`pad-${date}`} className={DAY_CELL_CLASS} />;
                        }

                        const info = availability[date];
                        const available = info?.available ?? false;
                        const isPast = isPastDate(date);
                        const isToday = date === todayStr;
                        const isSelected = selectedDate === date;
                        const dayNum = parseDate(date).getDate();
                        const isBooked = !isPast && !available;

                        return (
                            <div
                                key={date}
                                className={DAY_CELL_CLASS}
                                onMouseEnter={() => setHoveredDate(date)}
                                onMouseLeave={() => setHoveredDate(null)}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleDayClick(date, inMonth)}
                                    className={cn(
                                        DAY_CELL_CLASS,
                                        'relative flex items-center justify-center rounded-md text-xs font-medium transition-colors duration-150',
                                        isPast && 'calendar-day-past',
                                        !isPast && available && 'calendar-day-available',
                                        isBooked && 'calendar-day-booked',
                                        isToday && !isSelected && 'calendar-day-today',
                                        isSelected && 'calendar-day-selected',
                                    )}
                                >
                                    {formatInteger(dayNum)}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <span className="calendar-day-available size-2.5 rounded-full" />
                    متاح
                </span>
                <span className="flex items-center gap-1">
                    <span className="calendar-day-booked size-2.5 rounded-full" />
                    محجوز
                </span>
                <span className="flex items-center gap-1">
                    <span className="calendar-day-past size-2.5 rounded-full" />
                    سابق
                </span>
            </div>
        </div>
    );
}
