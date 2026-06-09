<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Services\BookingConflictValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingConflictValidatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_date_is_unavailable_when_any_active_booking_exists_regardless_of_type(): void
    {
        Booking::query()->create([
            'contract_number' => 'C-001',
            'customer_name' => 'عميل',
            'phone' => '0500000000',
            'amount' => 1000,
            'booking_date' => '2027-08-15',
            'type' => 'women',
            'status' => 'active',
        ]);

        $this->assertFalse(BookingConflictValidator::isAvailable('2027-08-15'));
    }

    public function test_cancelled_booking_does_not_block_date(): void
    {
        Booking::query()->create([
            'contract_number' => 'C-002',
            'customer_name' => 'عميل',
            'phone' => '0500000001',
            'amount' => 1000,
            'booking_date' => '2027-08-16',
            'type' => 'men',
            'status' => 'cancelled',
        ]);

        $this->assertTrue(BookingConflictValidator::isAvailable('2027-08-16'));
    }

    public function test_exclude_booking_id_allows_same_date_for_editing_booking(): void
    {
        $booking = Booking::query()->create([
            'contract_number' => 'C-003',
            'customer_name' => 'عميل',
            'phone' => '0500000002',
            'amount' => 1000,
            'booking_date' => '2027-08-17',
            'type' => 'full',
            'status' => 'active',
        ]);

        $this->assertTrue(BookingConflictValidator::isAvailable('2027-08-17', $booking->id));
    }
}
