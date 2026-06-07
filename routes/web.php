<?php

use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('bookings', function () {
        return Inertia::render('bookings/index');
    })->name('bookings.index');

    Route::get('bookings/{id}', function (int $id) {
        return Inertia::render('bookings/show', ['bookingId' => $id]);
    })->name('bookings.show');

    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/download', [ReportController::class, 'download'])->name('reports.download');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
