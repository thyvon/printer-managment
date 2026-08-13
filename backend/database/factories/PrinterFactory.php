<?php

namespace Database\Factories;

use App\Models\Printer;
use App\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Printer>
 */
class PrinterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'name' => fake()->word().' Printer',
            'manufacturer' => fake()->randomElement(['Canon', 'HP', 'Kyocera', 'Ricoh', 'Brother']),
            'model' => fake()->bothify('##-####'),
            'serial_number' => strtoupper(fake()->bothify('????####')),
            'ip_address' => fake()->ipv4(),
            'snmp_community' => 'public',
            'status' => 'online',
        ];
    }
}
