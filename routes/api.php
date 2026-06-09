<?php

use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/calendar/defaults', [CalendarController::class, 'defaults']);
    Route::get('/calendar/gregorian-to-hijri', [CalendarController::class, 'gregorianToHijri']);
    Route::get('/calendar/hijri-to-gregorian', [CalendarController::class, 'hijriToGregorian']);
    Route::get('/calendar/gregorian-month', [CalendarController::class, 'gregorianMonth']);
    Route::get('/calendar/hijri-year-bounds', [CalendarController::class, 'hijriYearBounds']);
    Route::get('/calendar/gregorian-year-bounds', [CalendarController::class, 'gregorianYearBounds']);

    Route::get('/dashboard/stats', DashboardController::class);

    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/availability', [BookingController::class, 'availability']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);

    Route::get('/bookings/{booking}/payments', [PaymentController::class, 'index']);
    Route::get('/bookings/{booking}/expenses', [ExpenseController::class, 'index']);

    Route::middleware('admin')->group(function () {
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::put('/bookings/{booking}', [BookingController::class, 'update']);
        Route::delete('/bookings/{booking}', [BookingController::class, 'destroy']);
        Route::patch('/bookings/{booking}/complete', [BookingController::class, 'complete']);
        Route::patch('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
        Route::patch('/bookings/{booking}/reactivate', [BookingController::class, 'reactivate']);

        Route::post('/bookings/{booking}/payments', [PaymentController::class, 'store']);
        Route::put('/bookings/{booking}/payments/{payment}', [PaymentController::class, 'update']);
        Route::delete('/bookings/{booking}/payments/{payment}', [PaymentController::class, 'destroy']);

        Route::post('/bookings/{booking}/expenses', [ExpenseController::class, 'store']);
        Route::put('/bookings/{booking}/expenses/{expense}', [ExpenseController::class, 'update']);
        Route::delete('/bookings/{booking}/expenses/{expense}', [ExpenseController::class, 'destroy']);
    });
});
