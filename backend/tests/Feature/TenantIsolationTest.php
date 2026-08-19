<?php

use App\Models\Collector;
use App\Models\Company;
use App\Models\Contract;
use App\Models\CounterReading;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Printer;
use App\Models\Site;
use App\Services\InvoicingService;
use App\Services\UsageCalculator;
use Carbon\Carbon;

it('isolates customer listings between tenants', function () {
    $companyA = makeTenant();
    Customer::factory()->count(2)->create(['company_id' => $companyA->id]);

    $companyB = Company::factory()->create();
    Customer::factory()->count(4)->create(['company_id' => $companyB->id]);

    $this->getJson('/api/customers')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('cannot read another tenants customer', function () {
    $foreign = Customer::factory()->create();

    makeTenant();

    $this->getJson("/api/customers/{$foreign->id}")->assertNotFound();
});

it('cannot read another tenants printer', function () {
    $foreign = Printer::factory()->create();

    makeTenant();

    $this->getJson("/api/printers/{$foreign->id}")->assertNotFound();
});

it('cannot read another tenants contract', function () {
    $foreign = Contract::factory()->create();

    makeTenant();

    $this->getJson("/api/contracts/{$foreign->id}")->assertNotFound();
});

it('cannot list another tenants invoices', function () {
    $foreignCustomer = Customer::factory()->create();
    Invoice::factory()->create(['customer_id' => $foreignCustomer->id]);

    $company = makeTenant();
    Customer::factory()->create(['company_id' => $company->id]);

    $this->getJson('/api/invoices')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('collector cannot ingest readings for another tenants printer', function () {
    $company = makeTenant();
    $site = Site::factory()->create(['company_id' => $company->id]);
    $collector = Collector::factory()->create(['site_id' => $site->id, 'company_id' => $company->id]);
    $foreignPrinter = Printer::factory()->create();

    $this->postJson('/api/collector/readings', [
        'readings' => [
            ['printer_id' => $foreignPrinter->id, 'total_pages' => 500],
        ],
    ], ['Authorization' => "Bearer {$collector->token}"])
        ->assertStatus(422);

    expect(CounterReading::count())->toBe(0);
});

it('usage calculation is scoped per tenant', function () {
    $company = makeTenant();

    $site = Site::factory()->create(['company_id' => $company->id]);
    $printer = Printer::factory()->create(['site_id' => $site->id, 'company_id' => $company->id]);
    $collector = Collector::factory()->create(['site_id' => $site->id, 'company_id' => $company->id]);

    CounterReading::factory()->create([
        'printer_id' => $printer->id,
        'collector_id' => $collector->id,
        'company_id' => $company->id,
        'total_pages' => 100,
        'read_at' => '2026-08-05 10:00:00',
    ]);

    $foreignSite = Site::factory()->create();
    $foreignPrinter = Printer::factory()->create(['site_id' => $foreignSite->id]);
    CounterReading::factory()->create([
        'printer_id' => $foreignPrinter->id,
        'collector_id' => Collector::factory()->create(['site_id' => $foreignSite->id])->id,
        'total_pages' => 999,
        'read_at' => '2026-08-05 10:00:00',
    ]);

    setTenantCompany($company->id);
    $usages = app(UsageCalculator::class)->calculateForMonth(Carbon::parse('2026-08-01'));
    setTenantCompany(null);

    expect($usages)->toHaveCount(1)
        ->and($usages->first()->printer_id)->toBe($printer->id)
        ->and($usages->first()->total_pages)->toBe(100);
});

it('invoice generation is scoped per tenant', function () {
    $company = makeTenant();
    $customer = Customer::factory()->create(['company_id' => $company->id, 'currency' => 'USD']);
    $contract = Contract::factory()->create([
        'customer_id' => $customer->id,
        'company_id' => $company->id,
        'monthly_fee' => 100,
        'status' => 'active',
    ]);
    $contract->pricingTiers()->create([
        'company_id' => $company->id,
        'name' => 'Tier 1',
        'currency' => 'USD',
        'included_mono_pages' => 1000,
        'included_color_pages' => 500,
        'mono_rate' => 0.05,
        'color_rate' => 0.30,
    ]);

    $foreignCustomer = Customer::factory()->create();
    Contract::factory()->create([
        'customer_id' => $foreignCustomer->id,
        'monthly_fee' => 50,
        'status' => 'active',
    ]);

    setTenantCompany($company->id);
    $invoice = app(InvoicingService::class)->generate($customer, Carbon::parse('2026-08-01'));
    setTenantCompany(null);

    expect((float) $invoice->total)->toBe(100.0)
        ->and(Invoice::where('customer_id', $foreignCustomer->id)->count())->toBe(0);
});
