<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_download_booking_report_pdf(): void
    {
        $user = User::factory()->create();

        $booking = Booking::query()->create([
            'contract_number' => 'C-2026-001',
            'customer_name' => 'عميل التقرير',
            'phone' => '0500000001',
            'amount' => 15000,
            'booking_date' => '2026-06-01',
            'type' => 'full',
            'status' => 'active',
        ]);

        Payment::query()->create([
            'booking_id' => $booking->id,
            'amount' => 5000,
            'payment_date' => '2026-01-15',
        ]);

        Expense::query()->create([
            'booking_id' => $booking->id,
            'amount' => 1200,
            'expense_date' => '2026-02-01',
        ]);

        $response = $this->actingAs($user)->get('/reports/download?from_date=2026-01-01&to_date=2026-12-31');

        $response
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_report_download_requires_valid_date_range(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/reports/download?from_date=2026-12-31&to_date=2026-01-01')
            ->assertSessionHasErrors(['to_date']);
    }
}
