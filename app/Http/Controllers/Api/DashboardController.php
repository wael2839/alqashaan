<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DashboardStatsRequest;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(DashboardStatsRequest $request): JsonResponse
    {
        $fromDate = $request->validated('from_date');
        $toDate = $request->validated('to_date');

        $bookingsQuery = Booking::query();

        if ($fromDate && $toDate) {
            $bookingsQuery->whereBetween('booking_date', [$fromDate, $toDate]);
        }

        $totalRevenue = Payment::query()
            ->when($fromDate && $toDate, function ($query) use ($fromDate, $toDate) {
                $query->whereHas('booking', fn ($bookingQuery) => $bookingQuery->whereBetween('booking_date', [$fromDate, $toDate]));
            })
            ->sum('amount');

        $collectedOutsidePeriod = 0.0;

        if ($fromDate && $toDate) {
            $collectedOutsidePeriod = (float) Payment::query()
                ->whereBetween('payment_date', [$fromDate, $toDate])
                ->whereHas('booking', function ($bookingQuery) use ($fromDate, $toDate) {
                    $bookingQuery->where(function ($query) use ($fromDate, $toDate) {
                        $query->where('booking_date', '<', $fromDate)
                            ->orWhere('booking_date', '>', $toDate);
                    });
                })
                ->sum('amount');
        }

        $totalExpenses = Expense::query()
            ->when($fromDate && $toDate, function ($query) use ($fromDate, $toDate) {
                $query->whereHas('booking', fn ($bookingQuery) => $bookingQuery->whereBetween('booking_date', [$fromDate, $toDate]));
            })
            ->sum('amount');

        $totalRevenue = (float) $totalRevenue;
        $totalExpenses = (float) $totalExpenses;

        return response()->json([
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'total_revenue' => $totalRevenue,
            'collected_outside_period' => $collectedOutsidePeriod,
            'total_expenses' => $totalExpenses,
            'net_profit' => $totalRevenue - $totalExpenses,
            'active_bookings' => (clone $bookingsQuery)->where('status', 'active')->count(),
            'completed_bookings' => (clone $bookingsQuery)->where('status', 'completed')->count(),
            'cancelled_bookings' => (clone $bookingsQuery)->where('status', 'cancelled')->count(),
            'total_bookings' => (clone $bookingsQuery)->count(),
            'monthly_trends' => $fromDate && $toDate
                ? $this->monthlyTrends($fromDate, $toDate)
                : [],
        ]);
    }

    /**
     * @return list<array{month: string, revenue: float, expenses: float, profit: float}>
     */
    private function monthlyTrends(string $fromDate, string $toDate): array
    {
        $months = [];
        $current = Carbon::parse($fromDate)->startOfMonth();
        $end = Carbon::parse($toDate)->startOfMonth();

        while ($current <= $end) {
            $monthStart = $current->copy()->startOfMonth()->toDateString();
            $monthEnd = $current->copy()->endOfMonth()->toDateString();
            $rangeStart = max($monthStart, $fromDate);
            $rangeEnd = min($monthEnd, $toDate);

            $revenue = (float) Payment::query()
                ->whereHas('booking', fn ($query) => $query->whereBetween('booking_date', [$rangeStart, $rangeEnd]))
                ->sum('amount');

            $expenses = (float) Expense::query()
                ->whereHas('booking', fn ($query) => $query->whereBetween('booking_date', [$rangeStart, $rangeEnd]))
                ->sum('amount');

            $months[] = [
                'month' => $current->format('Y-m'),
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $revenue - $expenses,
            ];

            $current->addMonth();
        }

        return $months;
    }
}
