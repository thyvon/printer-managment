<?php

namespace Database\Factories;

use App\Models\Collector;
use App\Models\CounterReading;
use App\Models\Printer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CounterReading>
 */
class CounterReadingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'collector_id' => Collector::factory(),
            'printer_id' => Printer::factory(),
            'total_pages' => fake()->numberBetween(0, 200000),
            'mono_pages' => fake()->numberBetween(0, 150000),
            'color_pages' => fake()->numberBetween(0, 50000),
            'read_at' => fake()->dateTimeThisMonth(),
        ];
    }
}
