import type { DashboardCalendarMode } from '@/components/dashboard-date-range-filter';
import type { DashboardMonthlyTrend } from '@/lib/api';
import { formatChartMonthLabel, formatCompactCurrency, formatCurrency } from '@/lib/dates';
import { useMemo } from 'react';
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

function ChartTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-md">
            <p className="mb-2 font-medium text-foreground">{label}</p>
            <div className="space-y-1">
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
    const chartData = useMemo<ChartPoint[]>(
        () =>
            data.map((point) => ({
                ...point,
                label: formatChartMonthLabel(point.month, calendarMode),
            })),
        [data, calendarMode],
    );

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
        <div className="min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }} barGap={4} barCategoryGap="20%">
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border)' }}
                        interval="preserveStartEnd"
                        minTickGap={24}
                    />
                    <YAxis
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tickFormatter={(value: number) => formatCompactCurrency(value)}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'color-mix(in srgb, var(--muted) 35%, transparent)' }} />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ paddingBottom: 12, fontSize: 13 }}
                        formatter={(value: string) => <span style={{ color: 'var(--foreground)' }}>{value}</span>}
                    />
                    <Bar dataKey="revenue" name="الإيرادات" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses" name="المصروفات" fill={CHART_COLORS.expenses} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="profit" name="صافي الربح" fill={CHART_COLORS.profit} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
