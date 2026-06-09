import { DashboardDateRangeFilter, type DashboardCalendarMode } from '@/components/dashboard-date-range-filter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardDefaultDateRange } from '@/hooks/use-dashboard-default-date-range';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'لوحة التحكم', href: '/dashboard' },
    { title: 'التقارير', href: '/reports' },
];

export default function ReportsIndex() {
    const [calendarMode, setCalendarMode] = useState<DashboardCalendarMode>('hijri');
    const { fromDate, toDate, setFromDate, setToDate, ready: rangeReady } = useDashboardDefaultDateRange(calendarMode);

    const downloadUrl = useMemo(() => {
        if (!fromDate || !toDate) {
            return '';
        }

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

                <Card className="panel-card">
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="section-title flex items-center gap-2.5">
                            <span className="icon-tile-primary flex size-8 items-center justify-center rounded-xl">
                                <FileText className="size-4" />
                            </span>
                            تقرير الحجوزات PDF
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <ul className="meta-text list-inside list-disc space-y-1">
                            <li>الحجوزات ضمن الفترة المحددة مع الإيرادات والمصروفات</li>
                            <li>اسم صاحب الحجز وتاريخ الحجز (ميلادي وهجري رسمي)</li>
                        </ul>
                        <Button asChild disabled={!downloadUrl}>
                            <a href={downloadUrl}>
                                <Download className="size-4" />
                                تحميل التقرير
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
