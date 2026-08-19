<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCollectorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'site_id' => ['required', Rule::exists('sites', 'id')->where('company_id', tenantCompanyId())],
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
