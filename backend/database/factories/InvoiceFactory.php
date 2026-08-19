<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'customer_id' => Customer::factory(),
            'contract_id' => Contract::factory(),
            'invoice_number' => 'INV-'.fake()->unique()->numerify('#####'),
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
            'currency' => 'USD',
            'subtotal' => 100,
            'tax' => 0,
            'total' => 100,
            'status' => 'draft',
        ];
    }
}
