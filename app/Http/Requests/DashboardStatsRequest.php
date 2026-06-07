<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DashboardStatsRequest extends FormRequest
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
            'from_date' => ['nullable', 'date', 'required_with:to_date'],
            'to_date' => ['nullable', 'date', 'required_with:from_date', 'after_or_equal:from_date'],
        ];
    }
}
