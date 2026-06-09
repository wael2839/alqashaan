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
        $bookingId = $this->route('booking')?->id;

        return [
            'contract_number' => ['nullable', 'string', 'max:100', Rule::unique('bookings', 'contract_number')->ignore($bookingId)],
            'customer_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'booking_date' => ['sometimes', 'date'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:500'],
            'type' => ['sometimes', Rule::in(['full', 'men', 'women'])],
        ];
    }
}
