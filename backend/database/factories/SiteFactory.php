<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Site>
 */
class SiteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'name' => fake()->company().' HQ',
            'address' => fake()->address(),
            'city' => 'Phnom Penh',
            'phone' => fake()->phoneNumber(),
        ];
    }
}
