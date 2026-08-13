<?php

use App\Models\Collector;
use App\Models\CounterReading;
use App\Models\Printer;
use App\Models\Site;

it('stores counter readings as an append-only batch', function () {
    $site = Site::factory()->create();
    $collector = Collector::factory()->create(['site_id' => $site->id]);
    $printer = Printer::factory()->create(['site_id' => $site->id]);

    $response = $this->postJson('/api/collector/readings', [
        'readings' => [
            [
                'printer_id' => $printer->id,
                'total_pages' => 1000,
                'mono_pages' => 800,
                'color_pages' => 200,
                'read_at' => '2026-08-01 10:00:00',
            ],
            [
                'printer_id' => $printer->id,
                'total_pages' => 1200,
                'mono_pages' => 950,
                'color_pages' => 250,
                'read_at' => '2026-08-02 10:00:00',
            ],
        ],
    ], ['Authorization' => "Bearer {$collector->token}"])
        ->assertOk()
        ->assertJsonPath('count', 2);

    expect(CounterReading::count())->toBe(2);
});

it('rejects a reading for a printer outside the collectors site', function () {
    $site = Site::factory()->create();
    $otherSite = Site::factory()->create();
    $collector = Collector::factory()->create(['site_id' => $site->id]);
    $foreignPrinter = Printer::factory()->create(['site_id' => $otherSite->id]);

    $this->postJson('/api/collector/readings', [
        'readings' => [
            ['printer_id' => $foreignPrinter->id, 'total_pages' => 500],
        ],
    ], ['Authorization' => "Bearer {$collector->token}"])
        ->assertStatus(422);
});

it('prevents updating an existing reading', function () {
    $reading = CounterReading::factory()->create(['total_pages' => 100]);

    $this->expectException(RuntimeException::class);

    $reading->update(['total_pages' => 200]);
});

it('prevents deleting an existing reading', function () {
    $reading = CounterReading::factory()->create();

    $this->expectException(RuntimeException::class);

    $reading->delete();
});

it('requires collector auth to ingest readings', function () {
    $this->postJson('/api/collector/readings', [
        'readings' => [],
    ])->assertStatus(401);
});
