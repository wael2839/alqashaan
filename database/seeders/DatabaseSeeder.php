<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@alqashaan.com',
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Viewer User',
            'email' => 'viewer@alqashaan.com',
            'role' => 'viewer',
        ]);

        $booking = Booking::query()->create([
            'contract_number' => 'CNT-2026-001',
            'customer_name' => 'أحمد محمد',
            'phone' => '0501234567',
            'amount' => 25000,
            'booking_date' => now()->addDays(14)->format('Y-m-d'),
            'type' => 'full',
            'status' => 'active',
        ]);

        Payment::query()->create([
            'booking_id' => $booking->id,
            'amount' => 25000,
            'description' => 'دفعة أولى',
            'payment_date' => now()->format('Y-m-d'),
        ]);

        Expense::query()->create([
            'booking_id' => $booking->id,
            'amount' => 5000,
            'description' => 'تنسيق القاعة',
            'expense_date' => now()->format('Y-m-d'),
        ]);
    }
}
