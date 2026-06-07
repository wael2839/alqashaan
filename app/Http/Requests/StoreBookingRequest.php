<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
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
        return [
            'contract_number' => ['required', 'string', 'max:100', 'unique:bookings,contract_number'],
            'customer_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'booking_date' => ['required', 'date'],
            'type' => ['required', Rule::in(['full', 'men', 'women'])],
            'status' => ['sometimes', Rule::in(['active'])],
        ];
    }
}
