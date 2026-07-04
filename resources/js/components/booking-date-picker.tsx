import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookingsApi, type BookedSlot, type Booking } from '@/lib/api';
import {
    BOOKING_TYPE_LABELS,
    formatBookingDayStatus,
    formatDualDate,
    formatInteger,
} from '@/lib/dates';
import { primeGregorianMonth, type HijriParts } from '@/lib/saudi-hijri-calendar';
import { cn } from '@/lib/utils';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

const WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خم', 'جمع', 'سب'];
const POPOVER_WIDTH = 352;
const POPOVER_BRIDGE = 14;

const MONTHS = Array.from({ length: 12 }, (_, index) => {
    const value = String(index + 1);
    return { value, label: value.padStart(2, '0') };
});

interface BookingDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    type: Booking['type'];
    error?: string;
    excludeBookingId?: number;
}

function toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseDate(date: string): Date {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isPastDate(dateStr: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parseDate(dateStr) < today;
}

function formatBookedSlots(bookings: BookedSlot[]): string {
    return bookings.map((booking) => `${booking.customer_name} (${BOOKING_TYPE_LABELS[booking.type]})`).join(' — ');
}

function getEventElement(target: EventTarget | null): Element | null {
    if (target instanceof Element) {
        return target;
    }

    if (target instanceof Node) {
        return target.parentElement;
    }

    return null;
}

function isInsidePortaledOverlay(target: EventTarget | null): boolean {
    const element = getEventElement(target);

    if (!element) {
        return false;
    }

    return !!element.closest('[data-radix-select-content], [data-radix-select-viewport], [role="listbox"], [data-booking-date-picker-popover]');
}

export function isBookingDatePickerInteraction(target: EventTarget | null): boolean {
    return isInsidePortaledOverlay(target);
}

export function preventDialogDismissOnDatePicker(event: Event): void {
    if (isBookingDatePickerInteraction(event.target)) {
        event.preventDefault();
    }
}

export function BookingDatePicker({ value, onChange, type, error, excludeBookingId }: BookingDatePickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({ visibility: 'hidden' });
    const [placement, setPlacement] = useState<'above' | 'below'>('above');
    const [arrowOffset, setArrowOffset] = useState(POPOVER_WIDTH / 2);
    const [viewDate, setViewDate] = useState(() => (value ? parseDate(value) : new Date()));
    const [availability, setAvailability] = useState<Record<string, { available: boolean; bookings: BookedSlot[]; hijri?: HijriParts | null }>>({});
    const [selectedHijri, setSelectedHijri] = useState<HijriParts | null>(null);
    const [loading, setLoading] = useState(false);
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const [focusedDate, setFocusedDate] = useState<string | null>(null);

    const monthKey = toMonthKey(viewDate);

    const loadAvailability = useCallback(() => {
        setLoading(true);
        bookingsApi
            .availability({ month: monthKey, type, exclude_booking_id: excludeBookingId })
            .then((data) => {
                const map: Record<string, { available: boolean; bookings: BookedSlot[]; hijri?: HijriParts | null }> = {};
                data.dates.forEach((day) => {
                    map[day.date] = { available: day.available, bookings: day.bookings, hijri: day.hijri };
                });
                primeGregorianMonth(monthKey, data.dates);
                setAvailability(map);
            })
            .finally(() => setLoading(false));
    }, [monthKey, type, excludeBookingId]);

    const updatePopoverPosition = useCallback(() => {
        const trigger = triggerRef.current;
        const panel = panelRef.current;
        const shell = popoverRef.current;

        if (!trigger || !panel || !shell) {
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const width = Math.min(POPOVER_WIDTH, window.innerWidth - 32);
        const viewportPadding = 16;
        const panelHeight = panel.offsetHeight;
        const shellHeight = panelHeight + POPOVER_BRIDGE;

        let left = rect.left + rect.width / 2 - width / 2;
        if (left + width > window.innerWidth - viewportPadding) {
            left = window.innerWidth - width - viewportPadding;
        }
        left = Math.max(viewportPadding, left);

        const triggerCenterX = rect.left + rect.width / 2;
        const arrowLeft = Math.max(20, Math.min(width - 20, triggerCenterX - left));

        const spaceBelow = window.innerHeight - viewportPadding - (rect.bottom + POPOVER_BRIDGE);
        const spaceAbove = rect.top - POPOVER_BRIDGE - viewportPadding;
        const openAbove = spaceAbove >= shellHeight || spaceAbove >= spaceBelow;

        let top: number;
        if (openAbove) {
            top = rect.top - shellHeight;
            if (top < viewportPadding) {
                top = viewportPadding;
            }
        } else {
            top = rect.bottom;
            if (top + shellHeight > window.innerHeight - viewportPadding) {
                top = Math.max(viewportPadding, window.innerHeight - viewportPadding - shellHeight);
            }
        }

        setPlacement(openAbove ? 'above' : 'below');
        setArrowOffset(arrowLeft);
        setPopoverStyle({
            position: 'fixed',
            top,
            left,
            width,
            visibility: 'visible',
            zIndex: 9999,
            pointerEvents: 'auto',
            paddingTop: openAbove ? 0 : POPOVER_BRIDGE,
            paddingBottom: openAbove ? POPOVER_BRIDGE : 0,
        });
    }, []);

    useEffect(() => {
        if (value) {
            setViewDate(parseDate(value));
        }
    }, [value]);

    useEffect(() => {
        if (value) {
            setSelectedHijri(availability[value]?.hijri ?? null);
        }
    }, [value, availability]);

    useEffect(() => {
        if (open) {
            loadAvailability();
        }
    }, [open, loadAvailability]);

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        updatePopoverPosition();

        const handleReposition = () => updatePopoverPosition();
        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);

        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [open, loading, viewDate, updatePopoverPosition]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null;

            if (!target) {
                return;
            }

            if (containerRef.current?.contains(target) || popoverRef.current?.contains(target) || isInsidePortaledOverlay(target)) {
                return;
            }

            setOpen(false);
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay();
        const days: { date: string; inMonth: boolean }[] = [];

        for (let i = startPadding - 1; i >= 0; i--) {
            days.push({ date: formatIso(new Date(year, month, -i)), inMonth: false });
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

    const todayStr = formatIso(new Date());

    const handleSelect = (dateStr: string) => {
        const info = availability[dateStr];
        if (!info?.available || isPastDate(dateStr)) {
            return;
        }

        onChange(dateStr);
        setOpen(false);
    };

    const goMonth = (delta: number) => {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
        setHoveredDate(null);
        setFocusedDate(null);
    };

    const minYear = new Date().getFullYear();
    const yearOptions = useMemo(() => Array.from({ length: 16 }, (_, i) => minYear + i), [minYear]);

    const handleMonthChange = (month: string) => {
        setViewDate((prev) => new Date(prev.getFullYear(), Number(month) - 1, 1));
        setHoveredDate(null);
        setFocusedDate(null);
    };

    const handleYearChange = (year: string) => {
        setViewDate((prev) => new Date(Number(year), prev.getMonth(), 1));
        setHoveredDate(null);
        setFocusedDate(null);
    };

    const activeInfoDate = hoveredDate ?? focusedDate;
    const activeDayInfo = activeInfoDate ? availability[activeInfoDate] : null;
    const activeDayDates = activeInfoDate && activeDayInfo ? formatDualDate(activeInfoDate, activeDayInfo.hijri) : null;
    const activeDayIsPast = activeInfoDate ? isPastDate(activeInfoDate) : false;
    const activeDayIsAvailable = Boolean(activeDayInfo?.available && activeInfoDate && !activeDayIsPast);

    const calendarContent = (
        <div
            ref={popoverRef}
            data-booking-date-picker-popover
            className="calendar-popover-shell"
            style={popoverStyle}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
        >
            <div ref={panelRef} className="calendar-popover animate-in fade-in-0 zoom-in-95 relative p-4 shadow-xl">
                <span
                    aria-hidden
                    className={cn('calendar-popover-arrow', placement === 'above' ? 'calendar-popover-arrow-bottom' : 'calendar-popover-arrow-top')}
                    style={{ left: arrowOffset }}
                />
            <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0 border-border text-foreground hover:bg-accent"
                        onClick={() => goMonth(-1)}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                    <div className="grid flex-1 grid-cols-2 gap-2">
                        <Select value={String(viewDate.getMonth() + 1)} onValueChange={handleMonthChange}>
                            <SelectTrigger className="h-9" onPointerDown={(e) => e.stopPropagation()}>
                                <SelectValue placeholder="الشهر" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                                {MONTHS.map((month) => (
                                    <SelectItem key={month.value} value={month.value}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={String(viewDate.getFullYear())} onValueChange={handleYearChange}>
                            <SelectTrigger className="h-9" onPointerDown={(e) => e.stopPropagation()}>
                                <SelectValue placeholder="السنة" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                                {yearOptions.map((year) => (
                                    <SelectItem key={year} value={String(year)}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0 border-border text-foreground hover:bg-accent"
                        onClick={() => goMonth(1)}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                </div>

                <div
                    className={cn(
                        'min-h-[2.5rem] px-3 py-2 text-center text-xs leading-relaxed transition-all duration-200 ease-in-out',
                        activeInfoDate && activeDayInfo
                            ? activeDayInfo.available && !isPastDate(activeInfoDate)
                                ? 'calendar-info-available'
                                : isPastDate(activeInfoDate)
                                  ? 'calendar-info-past'
                                  : 'calendar-info-booked'
                            : 'calendar-info-empty border-dashed',
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
                        'مرّر فوق أي يوم لعرض التاريخ والتوفر'
                    )}
                </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="py-1 text-center text-xs font-medium text-muted-foreground">
                        {day}
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(({ date, inMonth }) => {
                        if (!inMonth) {
                            return <div key={`pad-${date}`} className="aspect-square" />;
                        }

                        const info = availability[date];
                        const available = info?.available ?? false;
                        const isPast = isPastDate(date);
                        const isSelected = value === date;
                        const isToday = date === todayStr;
                        const selectable = available && !isPast;
                        const dayNum = parseDate(date).getDate();

                        return (
                            <div
                                key={date}
                                className="aspect-square"
                                onMouseEnter={() => setHoveredDate(date)}
                                onMouseLeave={() => setHoveredDate(null)}
                            >
                                <button
                                    type="button"
                                    aria-disabled={!selectable}
                                    onClick={() => handleSelect(date)}
                                    onFocus={() => setFocusedDate(date)}
                                    onBlur={() => setFocusedDate(null)}
                                    className={cn(
                                        'relative flex h-full w-full items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ease-in-out',
                                        isPast && 'calendar-day-past',
                                        !isPast && available && !isSelected && 'calendar-day-available',
                                        !isPast && !available && 'calendar-day-booked',
                                        isSelected && selectable && 'calendar-day-selected',
                                        isToday && !isSelected && 'calendar-day-today',
                                        !selectable && 'cursor-not-allowed',
                                    )}
                                >
                                    {formatInteger(dayNum)}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <span className="calendar-day-available size-3 rounded-full" />
                    متاح
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="calendar-day-booked size-3 rounded-full" />
                    محجوز
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="calendar-day-past size-3 rounded-full" />
                    سابق
                </span>
            </div>
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="relative">
            <Button
                ref={triggerRef}
                type="button"
                variant="outline"
                className={cn(
                    'h-11 w-full justify-start gap-2 text-start font-normal',
                    !value && 'text-muted-foreground',
                    error && 'border-destructive ring-1 ring-destructive/30',
                )}
                onClick={() => {
                    setPopoverStyle({ visibility: 'hidden' });
                    setOpen((prev) => {
                        if (!prev && value) {
                            setViewDate(parseDate(value));
                        }
                        return !prev;
                    });
                }}
            >
                <CalendarDays className="size-4 shrink-0 text-primary" />
                {value ? (
                    <span className="flex flex-col items-start leading-tight">
                        <span className="text-foreground">{formatDualDate(value, selectedHijri).gregorian}</span>
                        <span className="text-xs text-primary">{formatDualDate(value, selectedHijri).hijri}</span>
                    </span>
                ) : (
                    'اختر تاريخ الحجز'
                )}
            </Button>

            {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}

            {open && typeof document !== 'undefined' && createPortal(calendarContent, document.body)}
        </div>
    );
}
