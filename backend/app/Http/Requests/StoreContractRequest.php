<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'name' => ['required', 'string', 'max:255'],
            'status' => ['sometimes', 'in:active,pending,expired,cancelled'],
            'monthly_fee' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'pricing_tiers' => ['sometimes', 'array'],
            'pricing_tiers.*.name' => ['required', 'string', 'max:255'],
            'pricing_tiers.*.currency' => ['required', 'in:USD,KHR'],
            'pricing_tiers.*.included_mono_pages' => ['required', 'integer', 'min:0'],
            'pricing_tiers.*.included_color_pages' => ['required', 'integer', 'min:0'],
            'pricing_tiers.*.mono_rate' => ['required', 'numeric', 'min:0'],
            'pricing_tiers.*.color_rate' => ['required', 'numeric', 'min:0'],
        ];
    }
}
