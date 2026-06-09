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

    protected function prepareForValidation(): void
    {
        if ($this->has('contract_number') && trim((string) $this->input('contract_number')) === '') {
            $this->merge(['contract_number' => null]);
        }

        if ($this->has('notes') && trim((string) $this->input('notes')) === '') {
            $this->merge(['notes' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'contract_number' => ['nullable', 'string', 'max:100', 'unique:bookings,contract_number'],
            'customer_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'booking_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
            'type' => ['required', Rule::in(['full', 'men', 'women'])],
            'status' => ['sometimes', Rule::in(['active'])],
        ];
    }
}
