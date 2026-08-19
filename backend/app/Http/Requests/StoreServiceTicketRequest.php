<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', Rule::exists('customers', 'id')->where('company_id', tenantCompanyId())],
            'site_id' => ['nullable', Rule::exists('sites', 'id')->where('company_id', tenantCompanyId())],
            'printer_id' => ['nullable', Rule::exists('printers', 'id')->where('company_id', tenantCompanyId())],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:open,assigned,in_progress,resolved,closed,cancelled'],
            'priority' => ['sometimes', 'in:low,medium,high,urgent'],
            'assigned_user_id' => ['nullable', Rule::exists('users', 'id')->where('company_id', tenantCompanyId())],
            'scheduled_at' => ['nullable', 'date'],
            'parts_used' => ['nullable', 'string'],
        ];
    }
}