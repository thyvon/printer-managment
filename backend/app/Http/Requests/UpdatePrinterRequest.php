<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePrinterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'site_id' => ['sometimes', Rule::exists('sites', 'id')->where('company_id', tenantCompanyId())],
            'name' => ['sometimes', 'string', 'max:255'],
            'manufacturer' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'ip_address' => ['nullable', 'ip'],
            'snmp_community' => ['nullable', 'string', 'max:50'],
            'status' => ['sometimes', Rule::in(['online', 'offline', 'maintenance'])],
        ];
    }
}
