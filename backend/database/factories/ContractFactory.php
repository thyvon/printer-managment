<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Contract;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contract>
 */
class ContractFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'customer_id' => Customer::factory(),
            'name' => fake()->randomElement(['Standard', 'Premium', 'Economy']).' Plan',
            'status' => 'active',
            'monthly_fee' => fake()->randomFloat(2, 50, 500),
            'start_date' => now()->subMonths(3),
            'end_date' => now()->addMonths(9),
        ];
    }
}
