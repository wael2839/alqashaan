import { DashboardDateRangeFilter, type DashboardCalendarMode } from '@/components/dashboard-date-range-filter';
import { DashboardMonthlyChart } from '@/components/dashboard-monthly-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboardApi, type DashboardStats } from '@/lib/api';
import { formatCurrency, formatInteger, getDefaultDashboardDateRange } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { BarChart3, CalendarDays, CircleDollarSign, HandCoins, Receipt, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'لوحة التحكم', href: '/dashboard' }];

const defaultRange = getDefaultDashboardDateRange();

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(defaultRange.from);
    const [toDate, setToDate] = useState(defaultRange.to);
    const [calendarMode, setCalendarMode] = useState<DashboardCalendarMode>('hijri');

    const loadStats = useCallback(() => {
        setLoading(true);
        dashboardApi
            .stats({ from_date: fromDate, to_date: toDate })
            .then(setStats)
            .finally(() => setLoading(false));
    }, [fromDate, toDate]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

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

                <DashboardDateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    calendarMode={calendarMode}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                    onCalendarModeChange={setCalendarMode}
                />

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

                {stats && (
                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="panel-card lg:col-span-1">
                            <CardHeader className="border-b border-border pb-4">
                                <CardTitle className="section-title flex items-center gap-2.5">
                                    <span className="icon-tile-primary flex size-8 items-center justify-center rounded-xl">
                                        <CalendarDays className="size-4" />
                                    </span>
                                    ملخص الحجوزات
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2.5 pt-4">
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
                            </CardContent>
                        </Card>

                        <Card className="panel-card lg:col-span-2">
                            <CardHeader className="border-b border-border pb-4">
                                <CardTitle className="section-title flex items-center gap-2.5">
                                    <span className="icon-tile-neutral flex size-8 items-center justify-center rounded-xl">
                                        <BarChart3 className="size-4" />
                                    </span>
                                    الأداء المالي الشهري
                                </CardTitle>
                                <p className="meta-text mt-1">حسب تاريخ الحجز — الإيرادات والمصروفات وصافي الربح لكل شهر</p>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <DashboardMonthlyChart
                                    data={stats.monthly_trends}
                                    calendarMode={calendarMode}
                                    loading={loading}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
