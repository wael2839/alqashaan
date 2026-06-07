<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_stats_filter_by_booking_date_including_all_payments_and_expenses(): void
    {
        $user = User::factory()->create();

        $futureBooking = Booking::query()->create([
            'contract_number' => 'C-2027-001',
            'customer_name' => 'عميل 2027',
            'phone' => '0500000001',
            'amount' => 10000,
            'booking_date' => '2027-06-01',
            'type' => 'full',
            'status' => 'active',
        ]);

        Payment::query()->create([
            'booking_id' => $futureBooking->id,
            'amount' => 1000,
            'description' => 'عربون',
            'payment_date' => '2026-01-15',
        ]);

        $currentBooking = Booking::query()->create([
            'contract_number' => 'C-2026-001',
            'customer_name' => 'عميل 2026',
            'phone' => '0500000002',
            'amount' => 8000,
            'booking_date' => '2026-06-01',
            'type' => 'full',
            'status' => 'active',
        ]);

        Payment::query()->create([
            'booking_id' => $currentBooking->id,
            'amount' => 500,
            'description' => 'عربون',
            'payment_date' => '2026-01-20',
        ]);

        Payment::query()->create([
            'booking_id' => $currentBooking->id,
            'amount' => 7000,
            'description' => 'دفعة لاحقة',
            'payment_date' => '2027-02-01',
        ]);

        Expense::query()->create([
            'booking_id' => $futureBooking->id,
            'amount' => 300,
            'description' => 'مصروف',
            'expense_date' => '2026-02-01',
        ]);

        Expense::query()->create([
            'booking_id' => $currentBooking->id,
            'amount' => 200,
            'description' => 'مصروف',
            'expense_date' => '2026-02-10',
        ]);

        Expense::query()->create([
            'booking_id' => $currentBooking->id,
            'amount' => 900,
            'description' => 'مصروف لاحق',
            'expense_date' => '2027-03-01',
        ]);

        $response = $this->actingAs($user)->getJson('/api/dashboard/stats?from_date=2026-01-01&to_date=2026-12-31');

        $response
            ->assertOk()
            ->assertJsonPath('from_date', '2026-01-01')
            ->assertJsonPath('to_date', '2026-12-31')
            ->assertJsonPath('total_revenue', 7500)
            ->assertJsonPath('collected_outside_period', 1000)
            ->assertJsonPath('total_expenses', 1100)
            ->assertJsonPath('net_profit', 6400)
            ->assertJsonPath('total_bookings', 1)
            ->assertJsonPath('active_bookings', 1)
            ->assertJsonCount(12, 'monthly_trends')
            ->assertJsonPath('monthly_trends.5.month', '2026-06')
            ->assertJsonPath('monthly_trends.5.revenue', 7500)
            ->assertJsonPath('monthly_trends.5.expenses', 1100)
            ->assertJsonPath('monthly_trends.5.profit', 6400);
    }

    public function test_dashboard_stats_require_both_dates_when_filtering(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/dashboard/stats?from_date=2026-01-01')
            ->assertUnprocessable();
    }
}
