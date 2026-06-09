import type { DashboardCalendarMode } from '@/components/dashboard-date-range-filter';
import type { DashboardMonthlyTrend } from '@/lib/api';
import { formatChartMonthLabel, formatCompactCurrency, formatCurrency } from '@/lib/dates';
import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface DashboardMonthlyChartProps {
    data: DashboardMonthlyTrend[];
    calendarMode: DashboardCalendarMode;
    loading?: boolean;
}

const CHART_COLORS = {
    revenue: '#059669',
    expenses: '#E11D48',
    profit: '#4F46E5',
};

interface ChartPoint {
    month: string;
    label: string;
    revenue: number;
    expenses: number;
    profit: number;
}

interface TooltipPayloadItem {
    color?: string;
    name?: string;
    value?: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
            <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
            <div className="space-y-1.5 text-sm">
                {payload.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">{formatCurrency(entry.value ?? 0)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DashboardMonthlyChart({ data, calendarMode, loading = false }: DashboardMonthlyChartProps) {
    const [chartData, setChartData] = useState<ChartPoint[]>([]);

    useEffect(() => {
        let cancelled = false;

        Promise.all(
            data.map(async (point) => ({
                ...point,
                label: await formatChartMonthLabel(point.month, calendarMode),
            })),
        ).then((points) => {
            if (!cancelled) {
                setChartData(points);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [data, calendarMode]);

    if (loading) {
        return (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    جاري تحميل الرسم...
                </span>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
                لا توجد بيانات شهرية للفترة المحددة
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={288}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                    tickFormatter={(value: number) => formatCompactCurrency(value)}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="revenue" name="الإيرادات" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="المصروفات" fill={CHART_COLORS.expenses} radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="صافي الربح" fill={CHART_COLORS.profit} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
