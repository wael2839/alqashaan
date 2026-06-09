<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Validation\ValidationException;

class BookingConflictValidator
{
    public static function validate(string $date, ?int $excludeBookingId = null): void
    {
        if (! self::isAvailable($date, $excludeBookingId)) {
            throw ValidationException::withMessages([
                'booking_date' => ['هذا التاريخ محجوز مسبقاً.'],
            ]);
        }
    }

    public static function isAvailable(string $date, ?int $excludeBookingId = null): bool
    {
        $query = Booking::query()
            ->where('status', 'active')
            ->whereDate('booking_date', $date);

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return ! $query->exists();
    }
}
