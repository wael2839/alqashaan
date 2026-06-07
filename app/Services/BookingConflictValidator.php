<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Validation\ValidationException;

class BookingConflictValidator
{
    /**
     * @return list<string>
     */
    public static function conflictingTypes(string $type): array
    {
        return match ($type) {
            'full' => ['full', 'men', 'women'],
            'men' => ['full', 'men'],
            'women' => ['full', 'women'],
            default => [],
        };
    }

    public static function validate(string $date, string $type, ?int $excludeBookingId = null): void
    {
        if (! self::isAvailable($date, $type, $excludeBookingId)) {
            throw ValidationException::withMessages([
                'booking_date' => ['This date is already booked for the selected hall type.'],
            ]);
        }
    }

    public static function isAvailable(string $date, string $type, ?int $excludeBookingId = null): bool
    {
        $conflictingTypes = self::conflictingTypes($type);

        $query = Booking::query()
            ->where('status', 'active')
            ->whereDate('booking_date', $date)
            ->whereIn('type', $conflictingTypes);

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return ! $query->exists();
    }
}
