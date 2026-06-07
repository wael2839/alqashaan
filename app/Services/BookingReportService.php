<?php

namespace App\Services;

use App\Models\Booking;
use App\Support\ArabicDateFormatter;

class BookingReportService
{
    private const TYPE_LABELS = [
        'full' => 'كامل',
        'men' => 'رجال',
        'women' => 'نساء',
    ];

    /**
     * @return array{
     *     from_date: string,
     *     to_date: string,
     *     period_label: string,
     *     period_gregorian: string,
     *     period_hijri: string,
     *     rows: list<array{
     *         customer_name: string,
     *         gregorian_date: string,
     *         hijri_date: string,
     *         type_label: string,
     *         amount: float,
     *         revenue: float,
     *         expenses: float,
     *         profit: float
     *     }>,
     *     totals: array{
     *         revenue: float,
     *         expenses: float,
     *         profit: float
     *     }
     * }
     */
    public function build(string $fromDate, string $toDate): array
    {
        $bookings = Booking::query()
            ->withSum('payments as total_revenue', 'amount')
            ->withSum('expenses as total_expenses', 'amount')
            ->whereBetween('booking_date', [$fromDate, $toDate])
            ->orderBy('booking_date')
            ->get();

        $rows = [];
        $totalRevenue = 0.0;
        $totalExpenses = 0.0;

        foreach ($bookings as $booking) {
            $revenue = (float) ($booking->total_revenue ?? 0);
            $expenses = (float) ($booking->total_expenses ?? 0);
            $profit = $revenue - $expenses;

            $rows[] = [
                'customer_name' => $booking->customer_name,
                'gregorian_date' => ArabicDateFormatter::gregorian($booking->booking_date->format('Y-m-d')),
                'hijri_date' => ArabicDateFormatter::hijriPlain($booking->booking_date->format('Y-m-d')),
                'type_label' => self::TYPE_LABELS[$booking->type] ?? $booking->type,
                'amount' => (float) $booking->amount,
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $profit,
            ];

            $totalRevenue += $revenue;
            $totalExpenses += $expenses;
        }

        return [
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'period_label' => ArabicDateFormatter::rangeLabel($fromDate, $toDate),
            'period_gregorian' => ArabicDateFormatter::gregorianRangeLabel($fromDate, $toDate),
            'period_hijri' => ArabicDateFormatter::hijriRangeLabel($fromDate, $toDate),
            'rows' => $rows,
            'totals' => [
                'revenue' => $totalRevenue,
                'expenses' => $totalExpenses,
                'profit' => $totalRevenue - $totalExpenses,
            ],
        ];
    }
}
