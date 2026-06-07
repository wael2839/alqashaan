<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('contract_number')->unique();
            $table->string('customer_name');
            $table->string('phone');
            $table->date('booking_date');
            $table->enum('type', ['full', 'men', 'women']);
            $table->enum('status', ['active', 'completed'])->default('active');
            $table->timestamps();

            $table->index('booking_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
