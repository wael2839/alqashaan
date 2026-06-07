<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Models\Booking;
use App\Services\BookingConflictValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 15), 1), 50);

        $paginator = Booking::query()
            ->withSum('payments as total_revenue', 'amount')
            ->withSum('expenses as total_expenses', 'amount')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search');

                $query->where(function ($inner) use ($search) {
                    $inner->where('contract_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when(
                $request->string('status')->toString() === 'active',
                fn ($query) => $query->orderBy('booking_date'),
                fn ($query) => $query->orderByDesc('booking_date'),
            )
            ->paginate($perPage);

        return response()->json([
            'data' => $paginator->getCollection()
                ->map(fn (Booking $booking) => $this->formatBooking($booking))
                ->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ]);
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        BookingConflictValidator::validate(
            $request->validated('booking_date'),
            $request->validated('type'),
        );

        $booking = DB::transaction(function () use ($request) {
            $data = $request->validated();
            $data['status'] = 'active';

            $booking = Booking::query()->create($data);

            $booking->payments()->create([
                'amount' => $data['amount'],
                'description' => 'مبلغ الحجز',
                'payment_date' => now()->format('Y-m-d'),
            ]);

            return $booking;
        });

        return response()->json([
            'message' => 'Booking created successfully.',
            'data' => $this->formatBooking($booking->fresh()),
        ], 201);
    }

    public function show(Booking $booking): JsonResponse
    {
        $booking->load(['payments', 'expenses']);

        return response()->json([
            'data' => array_merge($this->formatBooking($booking), [
                'payments' => $booking->payments,
                'expenses' => $booking->expenses,
            ]),
        ]);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): JsonResponse
    {
        $data = $request->validated();

        if ($booking->status !== 'active' && (isset($data['booking_date']) || isset($data['type']))) {
            throw ValidationException::withMessages([
                'booking_date' => ['لا يمكن تعديل التاريخ أو النوع إلا للحجوزات النشطة.'],
            ]);
        }

        if (isset($data['booking_date']) || isset($data['type'])) {
            BookingConflictValidator::validate(
                $data['booking_date'] ?? $booking->booking_date->format('Y-m-d'),
                $data['type'] ?? $booking->type,
                $booking->id,
            );
        }

        $booking->update($data);

        return response()->json([
            'message' => 'Booking updated successfully.',
            'data' => $this->formatBooking($booking->fresh()),
        ]);
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();

        return response()->json([
            'message' => 'Booking deleted successfully.',
        ]);
    }

    public function complete(Booking $booking): JsonResponse
    {
        if ($booking->status !== 'active') {
            throw ValidationException::withMessages([
                'status' => ['يمكن إنهاء الحجوزات النشطة فقط.'],
            ]);
        }

        $booking->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Booking completed successfully.',
            'data' => $this->formatBooking($booking->fresh()),
        ]);
    }

    public function cancel(Booking $booking): JsonResponse
    {
        if ($booking->status !== 'active') {
            throw ValidationException::withMessages([
                'status' => ['يمكن إلغاء الحجوزات النشطة فقط.'],
            ]);
        }

        $booking->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Booking cancelled successfully.',
            'data' => $this->formatBooking($booking->fresh()),
        ]);
    }

    public function reactivate(Booking $booking): JsonResponse
    {
        if (! in_array($booking->status, ['completed', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => ['يمكن إعادة تفعيل الحجوزات المكتملة أو الملغاة فقط.'],
            ]);
        }

        BookingConflictValidator::validate(
            $booking->booking_date->format('Y-m-d'),
            $booking->type,
            $booking->id,
        );

        $booking->update(['status' => 'active']);

        return response()->json([
            'message' => 'Booking reactivated successfully.',
            'data' => $this->formatBooking($booking->fresh()),
        ]);
    }

    public function availability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'type' => ['required', Rule::in(['full', 'men', 'women'])],
            'exclude_booking_id' => ['sometimes', 'integer', 'exists:bookings,id'],
        ]);

        $start = Carbon::parse($validated['month'].'-01')->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $excludeId = $validated['exclude_booking_id'] ?? null;

        $bookingsByDate = Booking::query()
            ->where('status', 'active')
            ->whereBetween('booking_date', [$start->toDateString(), $end->toDateString()])
            ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
            ->get(['booking_date', 'type', 'customer_name'])
            ->groupBy(fn (Booking $booking) => $booking->booking_date->format('Y-m-d'));

        $dates = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $dateStr = $cursor->format('Y-m-d');
            $dayBookings = $bookingsByDate->get($dateStr) ?? collect();
            $bookedTypes = $dayBookings->pluck('type')->unique()->values()->all();

            $dates[] = [
                'date' => $dateStr,
                'available' => BookingConflictValidator::isAvailable($dateStr, $validated['type'], $excludeId),
                'booked_types' => $bookedTypes,
                'bookings' => $dayBookings->map(fn (Booking $booking) => [
                    'type' => $booking->type,
                    'customer_name' => $booking->customer_name,
                ])->values()->all(),
            ];

            $cursor->addDay();
        }

        return response()->json([
            'data' => [
                'month' => $validated['month'],
                'type' => $validated['type'],
                'dates' => $dates,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatBooking(Booking $booking): array
    {
        $revenue = (float) ($booking->total_revenue ?? $booking->payments()->sum('amount'));
        $expenses = (float) ($booking->total_expenses ?? $booking->expenses()->sum('amount'));
        $amount = (float) $booking->amount;
        $amountPaid = $revenue;
        $amountRemaining = max(0, $amount - $amountPaid);

        return [
            'id' => $booking->id,
            'contract_number' => $booking->contract_number,
            'customer_name' => $booking->customer_name,
            'phone' => $booking->phone,
            'amount' => $amount,
            'amount_paid' => $amountPaid,
            'amount_remaining' => $amountRemaining,
            'is_fully_paid' => $amountPaid >= $amount,
            'booking_date' => $booking->booking_date->format('Y-m-d'),
            'type' => $booking->type,
            'status' => $booking->status,
            'total_revenue' => $revenue,
            'total_expenses' => $expenses,
            'net_profit' => $revenue - $expenses,
            'created_at' => $booking->created_at,
            'updated_at' => $booking->updated_at,
        ];
    }
}
