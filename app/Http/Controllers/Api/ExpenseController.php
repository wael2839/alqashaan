<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Booking;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    public function index(Booking $booking): JsonResponse
    {
        return response()->json([
            'data' => $booking->expenses()->orderByDesc('expense_date')->get(),
        ]);
    }

    public function store(StoreExpenseRequest $request, Booking $booking): JsonResponse
    {
        $this->ensureBookingAllowsFinancialChanges($booking);

        $expense = $booking->expenses()->create($request->validated());

        return response()->json([
            'message' => 'تم تسجيل المصروف بنجاح.',
            'data' => $expense,
        ], 201);
    }

    public function update(UpdateExpenseRequest $request, Booking $booking, Expense $expense): JsonResponse
    {
        abort_unless($expense->booking_id === $booking->id, 404);

        $this->ensureBookingAllowsFinancialChanges($booking);

        $expense->update($request->validated());

        return response()->json([
            'message' => 'تم تحديث المصروف بنجاح.',
            'data' => $expense->fresh(),
        ]);
    }

    public function destroy(Booking $booking, Expense $expense): JsonResponse
    {
        abort_unless($expense->booking_id === $booking->id, 404);

        $this->ensureBookingAllowsFinancialChanges($booking);

        $expense->delete();

        return response()->json([
            'message' => 'تم حذف المصروف بنجاح.',
        ]);
    }

    private function ensureBookingAllowsFinancialChanges(Booking $booking): void
    {
        if (! $booking->allowsFinancialChanges()) {
            throw ValidationException::withMessages([
                'booking' => ['لا يمكن إضافة أو تعديل المصروفات إلا للحجوزات النشطة. أعد تفعيل الحجز أولاً.'],
            ]);
        }
    }
}
