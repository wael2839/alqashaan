import { DashboardDateRangeFilter, type DashboardCalendarMode } from '@/components/dashboard-date-range-filter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { getDefaultDashboardDateRange } from '@/lib/dates';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'لوحة التحكم', href: '/dashboard' },
    { title: 'التقارير', href: '/reports' },
];

const defaultRange = getDefaultDashboardDateRange();

export default function ReportsIndex() {
    const [fromDate, setFromDate] = useState(defaultRange.from);
    const [toDate, setToDate] = useState(defaultRange.to);
    const [calendarMode, setCalendarMode] = useState<DashboardCalendarMode>('hijri');

    const downloadUrl = useMemo(() => {
        const params = new URLSearchParams({
            from_date: fromDate,
            to_date: toDate,
        });

        return `/reports/download?${params.toString()}`;
    }, [fromDate, toDate]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="التقارير" />
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">التقارير</h1>
                    <p className="page-subtitle">تقرير الحجوزات المالية حسب تاريخ الحجز ضمن الفترة المحددة</p>
                </div>

                <Card className="panel-card">
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="section-title flex items-center gap-2.5">
                            <span className="icon-tile-primary flex size-8 items-center justify-center rounded-xl">
                                <FileText className="size-4" />
                            </span>
                            تقرير الحجوزات (PDF)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <DashboardDateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            calendarMode={calendarMode}
                            onFromDateChange={setFromDate}
                            onToDateChange={setToDate}
                            onCalendarModeChange={setCalendarMode}
                        />

                        <div className="rounded-xl border border-border bg-muted/40 p-4">
                            <p className="section-label mb-2">محتويات التقرير</p>
                            <ul className="meta-text list-inside list-disc space-y-1">
                                <li>اسم صاحب الحجز وتاريخ الحجز (ميلادي وهجري)</li>
                                <li>نوع الحجز ومبلغ الحجز والمصاريف والربح لكل حجز</li>
                                <li>مجموع الإيرادات ومجموع المصاريف وصافي الربح في نهاية التقرير</li>
                            </ul>
                        </div>

                        <Button asChild className="w-full sm:w-auto">
                            <a href={downloadUrl}>
                                <Download className="ms-2 size-4" />
                                تحميل تقرير PDF
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
