<?php

namespace Database\Factories;

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
            'customer_id' => Customer::factory(),
            'contract_id' => Contract::factory(),
            'invoice_number' => 'INV-'.fake()->unique()->numerify('#####'),
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
            'currency' => 'USD',
            'status' => 'draft',
        ];
    }
}
