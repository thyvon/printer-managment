<?php

use App\Models\Collector;
use App\Models\Contract;
use App\Models\CounterReading;
use App\Models\Customer;
use App\Models\PricingTier;
use App\Models\Printer;
use App\Models\Site;
use App\Services\InvoicingService;
use App\Services\UsageCalculator;
use Carbon\Carbon;

beforeEach(function () {
    $this->customer = Customer::factory()->create(['currency' => 'USD']);
    $this->site = Site::factory()->create(['customer_id' => $this->customer->id]);
    $this->printer = Printer::factory()->create(['site_id' => $this->site->id]);
    $this->collector = Collector::factory()->create(['site_id' => $this->site->id]);
    $this->contract = Contract::factory()->create([
        'customer_id' => $this->customer->id,
        'monthly_fee' => 100,
        'status' => 'active',
    ]);
});

function seedUsageFor(Customer $customer, Site $site, Printer $printer, Collector $collector, int $mono, int $color): void
{
    CounterReading::factory()->create([
        'printer_id' => $printer->id,
        'collector_id' => $collector->id,
        'total_pages' => 1000,
        'mono_pages' => 500,
        'color_pages' => 500,
        'read_at' => '2026-07-31 23:00:00',
    ]);
    CounterReading::factory()->create([
        'printer_id' => $printer->id,
        'collector_id' => $collector->id,
        'total_pages' => 1000 + $mono + $color,
        'mono_pages' => 500 + $mono,
        'color_pages' => 500 + $color,
        'read_at' => '2026-08-20 10:00:00',
    ]);
}

it('generates an invoice applying contract pricing tiers', function () {
    PricingTier::factory()->create([
        'contract_id' => $this->contract->id,
        'currency' => 'USD',
        'included_mono_pages' => 100,
        'included_color_pages' => 50,
        'mono_rate' => 0.05,
        'color_rate' => 0.30,
    ]);

    seedUsageFor($this->customer, $this->site, $this->printer, $this->collector, mono: 300, color: 200);

    app(UsageCalculator::class)->calculateForMonth(Carbon::parse('2026-08-01'));

    $invoice = app(InvoicingService::class)->generate(
        $this->customer,
        Carbon::parse('2026-08-01')
    );

    // monthly 100 + mono overage (300-100)*0.05=10 + color overage (200-50)*0.30=45 => 155
    expect((float) $invoice->total)->toBe(155.0)
        ->and($invoice->currency)->toBe('USD')
        ->and($invoice->lines)->toHaveCount(3)
        ->and($invoice->invoice_number)->toContain('INV-');
});

it('does not charge overage when usage is within included volume', function () {
    PricingTier::factory()->create([
        'contract_id' => $this->contract->id,
        'currency' => 'USD',
        'included_mono_pages' => 1000,
        'included_color_pages' => 1000,
        'mono_rate' => 0.05,
        'color_rate' => 0.30,
    ]);

    seedUsageFor($this->customer, $this->site, $this->printer, $this->collector, mono: 100, color: 50);

    app(UsageCalculator::class)->calculateForMonth(Carbon::parse('2026-08-01'));

    $invoice = app(InvoicingService::class)->generate(
        $this->customer,
        Carbon::parse('2026-08-01')
    );

    expect((float) $invoice->total)->toBe(100.0)
        ->and($invoice->lines)->toHaveCount(1);
});

it('throws when the customer has no active contract', function () {
    $this->contract->update(['status' => 'cancelled']);

    app(InvoicingService::class)->generate(
        $this->customer,
        Carbon::parse('2026-08-01')
    );
})->throws(RuntimeException::class);

it('supports KHR invoicing', function () {
    PricingTier::factory()->create([
        'contract_id' => $this->contract->id,
        'currency' => 'KHR',
        'included_mono_pages' => 100,
        'included_color_pages' => 50,
        'mono_rate' => 200,
        'color_rate' => 1200,
    ]);

    seedUsageFor($this->customer, $this->site, $this->printer, $this->collector, mono: 300, color: 200);

    app(UsageCalculator::class)->calculateForMonth(Carbon::parse('2026-08-01'));

    $invoice = app(InvoicingService::class)->generate(
        $this->customer,
        Carbon::parse('2026-08-01')
    );

    // monthly 100 + mono (200)*200=40000 + color (150)*1200=180000 => 220100
    expect((float) $invoice->total)->toBe(220100.0)
        ->and($invoice->currency)->toBe('KHR');
});
