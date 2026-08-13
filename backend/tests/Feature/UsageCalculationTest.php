<?php

use App\Models\Collector;
use App\Models\CounterReading;
use App\Models\Printer;
use App\Models\Site;
use App\Models\Usage;
use App\Services\UsageCalculator;
use Carbon\Carbon;

beforeEach(function () {
    $site = Site::factory()->create();
    $this->printer = Printer::factory()->create(['site_id' => $site->id]);
    $this->collector = Collector::factory()->create(['site_id' => $site->id]);
});

it('computes usage from counter deltas inside a period', function () {
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 1000,
        'mono_pages' => 700,
        'color_pages' => 300,
        'read_at' => '2026-07-31 23:00:00',
    ]);
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 1250,
        'mono_pages' => 850,
        'color_pages' => 400,
        'read_at' => '2026-08-15 10:00:00',
    ]);
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 1300,
        'mono_pages' => 875,
        'color_pages' => 425,
        'read_at' => '2026-08-20 10:00:00',
    ]);

    $usage = app(UsageCalculator::class)->calculateForPrinter(
        $this->printer,
        Carbon::parse('2026-08-01'),
        Carbon::parse('2026-08-31')
    );

    expect($usage)->not->toBeNull()
        ->and($usage->total_pages)->toBe(300)
        ->and($usage->mono_pages)->toBe(175)
        ->and($usage->color_pages)->toBe(125);
});

it('clamps negative deltas on counter reset', function () {
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 2000,
        'mono_pages' => 1500,
        'color_pages' => 500,
        'read_at' => '2026-07-31 23:00:00',
    ]);
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 500,
        'mono_pages' => 300,
        'color_pages' => 200,
        'read_at' => '2026-08-10 10:00:00',
    ]);

    $usage = app(UsageCalculator::class)->calculateForPrinter(
        $this->printer,
        Carbon::parse('2026-08-01'),
        Carbon::parse('2026-08-31')
    );

    expect($usage->total_pages)->toBe(0)
        ->and($usage->mono_pages)->toBe(0)
        ->and($usage->color_pages)->toBe(0);
});

it('uses first in-period reading when no baseline exists', function () {
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 500,
        'mono_pages' => 400,
        'color_pages' => 100,
        'read_at' => '2026-08-05 10:00:00',
    ]);

    $usage = app(UsageCalculator::class)->calculateForPrinter(
        $this->printer,
        Carbon::parse('2026-08-01'),
        Carbon::parse('2026-08-31')
    );

    expect($usage->total_pages)->toBe(500)
        ->and($usage->mono_pages)->toBe(400)
        ->and($usage->color_pages)->toBe(100);
});

it('returns null when no readings exist in the period', function () {
    $usage = app(UsageCalculator::class)->calculateForPrinter(
        $this->printer,
        Carbon::parse('2026-08-01'),
        Carbon::parse('2026-08-31')
    );

    expect($usage)->toBeNull();
});

it('is idempotent for the same period', function () {
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 100,
        'read_at' => '2026-08-05 10:00:00',
    ]);

    $calculator = app(UsageCalculator::class);
    $calculator->calculateForPrinter($this->printer, Carbon::parse('2026-08-01'), Carbon::parse('2026-08-31'));
    $calculator->calculateForPrinter($this->printer, Carbon::parse('2026-08-01'), Carbon::parse('2026-08-31'));

    expect(Usage::count())->toBe(1);
});

it('calculates usage for a whole month across printers', function () {
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 1000,
        'read_at' => '2026-07-31 23:00:00',
    ]);
    CounterReading::factory()->create([
        'printer_id' => $this->printer->id,
        'collector_id' => $this->collector->id,
        'total_pages' => 1200,
        'read_at' => '2026-08-15 10:00:00',
    ]);

    $usages = app(UsageCalculator::class)->calculateForMonth(Carbon::parse('2026-08-01'));

    expect($usages)->toHaveCount(1)
        ->and($usages->first()->total_pages)->toBe(200);
});
