<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    /** @use HasFactory<\Database\Factories\BookingFactory> */
    use HasFactory;

    protected $fillable = [
        'contract_number',
        'customer_name',
        'phone',
        'amount',
        'booking_date',
        'notes',
        'type',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'booking_date' => 'date:Y-m-d',
        ];
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function getTotalRevenueAttribute(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    public function getTotalExpensesAttribute(): float
    {
        return (float) $this->expenses()->sum('amount');
    }

    public function blocksAvailability(): bool
    {
        return $this->status === 'active';
    }

    public function allowsFinancialChanges(): bool
    {
        return $this->status === 'active';
    }

    public function getNetProfitAttribute(): float
    {
        return $this->total_revenue - $this->total_expenses;
    }

    public function getAmountPaidAttribute(): float
    {
        return $this->total_revenue;
    }

    public function getAmountRemainingAttribute(): float
    {
        return max(0, (float) $this->amount - $this->amount_paid);
    }

    public function getIsFullyPaidAttribute(): bool
    {
        return $this->amount_paid >= (float) $this->amount;
    }
}
