<?php

namespace Database\Factories;

use App\Models\Collector;
use App\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Collector>
 */
class CollectorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'name' => fake()->word().' Collector',
            'token' => fake()->sha256(),
            'version' => '1.0.0',
            'status' => 'inactive',
        ];
    }
}
