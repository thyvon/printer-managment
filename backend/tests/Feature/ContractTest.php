<?php

use App\Models\Contract;
use App\Models\Customer;
use App\Models\PricingTier;

it('creates a contract with pricing tiers', function () {
    $company = makeTenant();
    $customer = Customer::factory()->create(['company_id' => $company->id]);

    $response = $this->postJson('/api/contracts', [
        'customer_id' => $customer->id,
        'name' => 'Standard Plan',
        'monthly_fee' => 150,
        'start_date' => '2026-08-01',
        'end_date' => '2027-08-01',
        'pricing_tiers' => [
            [
                'name' => 'Tier 1',
                'currency' => 'USD',
                'included_mono_pages' => 1000,
                'included_color_pages' => 500,
                'mono_rate' => 0.05,
                'color_rate' => 0.30,
            ],
        ],
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Standard Plan')
        ->assertJsonCount(1, 'data.pricing_tiers');

    expect(Contract::where('name', 'Standard Plan')->exists())->toBeTrue()
        ->and(PricingTier::count())->toBe(1);
});

it('supports KHR currency tiers', function () {
    $company = makeTenant();
    $customer = Customer::factory()->create(['company_id' => $company->id]);

    $this->postJson('/api/contracts', [
        'customer_id' => $customer->id,
        'name' => 'KHR Plan',
        'pricing_tiers' => [
            [
                'name' => 'Tier 1',
                'currency' => 'KHR',
                'included_mono_pages' => 500,
                'included_color_pages' => 200,
                'mono_rate' => 200,
                'color_rate' => 1200,
            ],
        ],
    ])
        ->assertCreated()
        ->assertJsonPath('data.pricing_tiers.0.currency', 'KHR');
});

it('rejects invalid currency', function () {
    $company = makeTenant();
    $customer = Customer::factory()->create(['company_id' => $company->id]);

    $this->postJson('/api/contracts', [
        'customer_id' => $customer->id,
        'name' => 'Bad Plan',
        'pricing_tiers' => [
            [
                'name' => 'Tier 1',
                'currency' => 'EUR',
                'included_mono_pages' => 100,
                'included_color_pages' => 100,
                'mono_rate' => 0.05,
                'color_rate' => 0.30,
            ],
        ],
    ])->assertUnprocessable();
});

it('cannot attach a contract to another tenants customer', function () {
    makeTenant();
    $foreignCustomer = Customer::factory()->create();

    $this->postJson('/api/contracts', [
        'customer_id' => $foreignCustomer->id,
        'name' => 'Sneaky',
    ])->assertStatus(422);
});

it('shows a contract with its pricing tiers', function () {
    $company = makeTenant();
    $contract = Contract::factory()->create(['company_id' => $company->id]);
    $contract->pricingTiers()->createMany(PricingTier::factory()->count(2)->raw([
        'company_id' => $company->id,
    ]));

    $this->getJson("/api/contracts/{$contract->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data.pricing_tiers');
});

it('deletes a contract', function () {
    $company = makeTenant();
    $contract = Contract::factory()->create(['company_id' => $company->id]);

    $this->deleteJson("/api/contracts/{$contract->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('contracts', ['id' => $contract->id]);
});
