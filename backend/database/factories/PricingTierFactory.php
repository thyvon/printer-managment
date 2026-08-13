<?php

namespace Database\Factories;

use App\Models\Contract;
use App\Models\PricingTier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PricingTier>
 */
class PricingTierFactory extends Factory
{
    public function definition(): array
    {
        return [
            'contract_id' => Contract::factory(),
            'name' => 'Tier 1',
            'currency' => 'USD',
            'included_mono_pages' => 1000,
            'included_color_pages' => 500,
            'mono_rate' => 0.05,
            'color_rate' => 0.30,
        ];
    }
}
