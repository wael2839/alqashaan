<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function index(Booking $booking): JsonResponse
    {
        return response()->json([
            'data' => $booking->payments()->orderByDesc('payment_date')->get(),
        ]);
    }

    public function store(StorePaymentRequest $request, Booking $booking): JsonResponse
    {
        $this->ensureBookingAllowsFinancialChanges($booking);

        $payment = $booking->payments()->create($request->validated());

        return response()->json([
            'message' => 'Payment recorded successfully.',
            'data' => $payment,
        ], 201);
    }

    public function update(UpdatePaymentRequest $request, Booking $booking, Payment $payment): JsonResponse
    {
        abort_unless($payment->booking_id === $booking->id, 404);

        $this->ensureBookingAllowsFinancialChanges($booking);

        $payment->update($request->validated());

        return response()->json([
            'message' => 'Payment updated successfully.',
            'data' => $payment->fresh(),
        ]);
    }

    public function destroy(Booking $booking, Payment $payment): JsonResponse
    {
        abort_unless($payment->booking_id === $booking->id, 404);

        $this->ensureBookingAllowsFinancialChanges($booking);

        $payment->delete();

        return response()->json([
            'message' => 'Payment deleted successfully.',
        ]);
    }

    private function ensureBookingAllowsFinancialChanges(Booking $booking): void
    {
        if (! $booking->allowsFinancialChanges()) {
            throw ValidationException::withMessages([
                'booking' => ['لا يمكن إضافة أو تعديل المدفوعات إلا للحجوزات النشطة. أعد تفعيل الحجز أولاً.'],
            ]);
        }
    }
}
