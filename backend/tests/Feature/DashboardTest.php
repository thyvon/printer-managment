<?php

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Printer;
use App\Models\Site;
use App\Models\Usage;

it('returns the dashboard summary for the authenticated tenant', function () {
    $company = makeTenant();

    $customer = Customer::factory()->create(['company_id' => $company->id]);
    $site = Site::factory()->create(['company_id' => $company->id, 'customer_id' => $customer->id]);
    $printer = Printer::factory()->create(['company_id' => $company->id, 'site_id' => $site->id]);
    Usage::factory()->create([
        'company_id' => $company->id,
        'printer_id' => $printer->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'mono_pages' => 100,
        'color_pages' => 50,
        'total_pages' => 150,
    ]);
    Invoice::factory()->create([
        'company_id' => $company->id,
        'customer_id' => $customer->id,
        'total' => 99.90,
        'status' => 'sent',
    ]);

    $response = $this->getJson('/api/dashboard');

    $response->assertOk()
        ->assertJsonPath('counts.customers', 1)
        ->assertJsonPath('counts.sites', 1)
        ->assertJsonPath('counts.printers', 1)
        ->assertJsonPath('invoices_this_month.count', 1)
        ->assertJsonStructure([
            'usage_trend' => [
                '*' => ['month', 'total_pages', 'mono_pages', 'color_pages'],
            ],
            'recent_invoices',
            'printers',
            'customers',
        ]);

    $trend = $response->json('usage_trend');
    expect($trend)->toHaveCount(1)
        ->and($trend[0]['total_pages'])->toBe(150);
});

it('does not leak other tenants into the dashboard summary', function () {
    makeTenant();

    $other = Company::factory()->create();
    $otherCustomer = Customer::factory()->create(['company_id' => $other->id]);
    $otherSite = Site::factory()->create(['company_id' => $other->id, 'customer_id' => $otherCustomer->id]);
    $otherPrinter = Printer::factory()->create(['company_id' => $other->id, 'site_id' => $otherSite->id]);
    Usage::factory()->create([
        'company_id' => $other->id,
        'printer_id' => $otherPrinter->id,
        'mono_pages' => 999,
        'total_pages' => 999,
    ]);
    Invoice::factory()->create([
        'company_id' => $other->id,
        'customer_id' => $otherCustomer->id,
        'total' => 999,
    ]);

    $this->getJson('/api/dashboard')
        ->assertOk()
        ->assertJsonPath('counts.customers', 0)
        ->assertJsonPath('counts.printers', 0)
        ->assertJsonPath('counts.sites', 0)
        ->assertJsonPath('invoices_this_month.count', 0)
        ->assertJsonPath('usage_trend', []);
});

it('requires authentication for the dashboard', function () {
    $this->getJson('/api/dashboard')->assertUnauthorized();
});
