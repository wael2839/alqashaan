<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $bookingId = $this->route('booking')?->id;

        return [
            'contract_number' => ['sometimes', 'string', 'max:100', Rule::unique('bookings', 'contract_number')->ignore($bookingId)],
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'booking_date' => ['sometimes', 'date'],
            'type' => ['sometimes', Rule::in(['full', 'men', 'women'])],
        ];
    }
}
