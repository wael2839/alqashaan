import { BookingAvailabilityCalendar } from '@/components/booking-availability-calendar';
import { DashboardDateRangeFilter, type DashboardCalendarMode } from '@/components/dashboard-date-range-filter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useDashboardDefaultDateRange } from '@/hooks/use-dashboard-default-date-range';
import { dashboardApi, type DashboardStats } from '@/lib/api';
import { formatCurrency, formatInteger } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CalendarDays, CalendarRange, CircleDollarSign, HandCoins, Receipt, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'لوحة التحكم', href: '/dashboard' }];

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [calendarMode, setCalendarMode] = useState<DashboardCalendarMode>('hijri');
    const { fromDate, toDate, setFromDate, setToDate, ready: rangeReady } = useDashboardDefaultDateRange(calendarMode);

    const loadStats = useCallback(() => {
        if (!fromDate || !toDate) {
            return;
        }

        setLoading(true);
        dashboardApi
            .stats({ from_date: fromDate, to_date: toDate })
            .then(setStats)
            .finally(() => setLoading(false));
    }, [fromDate, toDate]);

    useEffect(() => {
        if (rangeReady) {
            loadStats();
        }
    }, [loadStats, rangeReady]);

    const cards = [
        {
            title: 'إجمالي الإيرادات',
            value: stats ? formatCurrency(stats.total_revenue) : '—',
            icon: CircleDollarSign,
            iconClass: 'icon-tile-revenue',
            valueClass: 'finance-text-revenue',
            hint: 'مجموع مدفوعات الحجوزات التي تاريخها ضمن الفترة',
        },
        {
            title: 'إجمالي المصروفات',
            value: stats ? formatCurrency(stats.total_expenses) : '—',
            icon: Receipt,
            iconClass: 'icon-tile-expense',
            valueClass: 'finance-text-expense',
            hint: 'مجموع مصروفات الحجوزات التي تاريخها ضمن الفترة',
        },
        {
            title: 'صافي الربح',
            value: stats ? formatCurrency(stats.net_profit) : '—',
            icon: TrendingUp,
            iconClass: 'icon-tile-neutral',
            valueClass: stats && stats.net_profit >= 0 ? 'finance-text-profit' : 'finance-text-expense',
        },
        {
            title: 'مقبوضات خارج فترة الحجز',
            value: stats ? formatCurrency(stats.collected_outside_period) : '—',
            icon: HandCoins,
            iconClass: 'icon-tile-revenue',
            valueClass: 'finance-text-revenue',
            hint: 'مبالغ قبضت خلال الفترة لحجوزات تاريخها خارجها',
        },
        {
            title: 'الحجوزات النشطة',
            value: stats ? formatInteger(stats.active_bookings) : '—',
            icon: CalendarDays,
            iconClass: 'icon-tile-primary',
            valueClass: 'text-foreground',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="لوحة التحكم" />
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">لوحة التحكم</h1>
                    <p className="page-subtitle">الإحصائيات المالية وملخص الحجوزات حسب تاريخ الحجز ضمن الفترة المحددة</p>
                </div>

                {rangeReady && (
                    <DashboardDateRangeFilter
                        fromDate={fromDate}
                        toDate={toDate}
                        calendarMode={calendarMode}
                        onFromDateChange={setFromDate}
                        onToDateChange={setToDate}
                        onCalendarModeChange={setCalendarMode}
                    />
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {cards.map((card) => (
                        <Card key={card.title} className="stat-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="section-label">{card.title}</CardTitle>
                                <div className={cn('stat-card-icon', card.iconClass)}>
                                    <card.icon className="size-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className={cn('text-2xl font-semibold tabular-nums tracking-tight', loading ? 'animate-pulse text-muted-foreground/40' : card.valueClass)}>
                                    {loading ? '...' : card.value}
                                </p>
                                {'hint' in card && card.hint && (
                                    <p className="meta-text mt-1.5 leading-snug">{card.hint}</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <Card className="panel-card min-w-0 flex-1">
                        <CardHeader className="border-b border-border pb-4">
                            <CardTitle className="section-title flex items-center gap-2.5">
                                <span className="icon-tile-primary flex size-8 items-center justify-center rounded-xl">
                                    <CalendarDays className="size-4" />
                                </span>
                                ملخص الحجوزات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 pt-4">
                            {loading || !stats ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                    <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    جاري التحميل...
                                </div>
                            ) : (
                                <>
                                    <div className="summary-row bg-muted/60">
                                        <span className="section-label">إجمالي الحجوزات</span>
                                        <span className="text-lg font-semibold text-foreground">{formatInteger(stats.total_bookings)}</span>
                                    </div>
                                    <div className="summary-row icon-tile-primary rounded-xl px-4 py-3">
                                        <span className="section-label">حجوزات نشطة</span>
                                        <span className="text-lg font-semibold text-primary">{formatInteger(stats.active_bookings)}</span>
                                    </div>
                                    <div className="summary-row finance-tile-revenue rounded-xl px-4 py-3">
                                        <span className="section-label">حجوزات مكتملة</span>
                                        <span className="text-lg font-semibold finance-text-revenue">{formatInteger(stats.completed_bookings)}</span>
                                    </div>
                                    {stats.cancelled_bookings > 0 && (
                                        <div className="summary-row alert-banner-warning rounded-xl px-4 py-3">
                                            <span className="section-label">حجوزات ملغاة</span>
                                            <span className="text-lg font-semibold">{formatInteger(stats.cancelled_bookings)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="panel-card w-full shrink-0 lg:w-fit">
                        <CardHeader className="border-b border-border pb-3">
                            <CardTitle className="section-title flex items-center gap-2.5">
                                <span className="icon-tile-primary flex size-8 items-center justify-center rounded-xl">
                                    <CalendarRange className="size-4" />
                                </span>
                                تقويم التوفر
                            </CardTitle>
                            <p className="meta-text mt-1">الأيام المتاحة والمحجوزة — التاريخ المعتمد ميلادي</p>
                        </CardHeader>
                        <CardContent className="w-fit max-w-full p-4 pt-4">
                            <BookingAvailabilityCalendar />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
