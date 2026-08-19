<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\CounterReading;
use App\Models\Printer;
use App\Models\Usage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Usage>
 */
class UsageFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->dateTimeThisYear();

        return [
            'company_id' => Company::factory(),
            'printer_id' => Printer::factory(),
            'period_start' => $start->format('Y-m-d'),
            'period_end' => (clone $start)->modify('last day of')->format('Y-m-d'),
            'start_reading_id' => CounterReading::factory(),
            'end_reading_id' => CounterReading::factory(),
            'total_pages' => fake()->numberBetween(100, 5000),
            'mono_pages' => fake()->numberBetween(50, 4000),
            'color_pages' => fake()->numberBetween(0, 1000),
        ];
    }
}
