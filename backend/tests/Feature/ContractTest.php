<?php

use App\Models\Contract;
use App\Models\Customer;
use App\Models\PricingTier;
use App\Models\User;

it('creates a contract with pricing tiers', function () {
    $customer = Customer::factory()->create();

    $response = $this->actingAs(User::factory()->create())
        ->postJson('/api/contracts', [
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
    $customer = Customer::factory()->create();

    $this->actingAs(User::factory()->create())
        ->postJson('/api/contracts', [
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
    $customer = Customer::factory()->create();

    $this->actingAs(User::factory()->create())
        ->postJson('/api/contracts', [
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
        ])
        ->assertUnprocessable();
});

it('shows a contract with its pricing tiers', function () {
    $contract = Contract::factory()->has(PricingTier::factory()->count(2))->create();

    $this->actingAs(User::factory()->create())
        ->getJson("/api/contracts/{$contract->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data.pricing_tiers');
});

it('deletes a contract', function () {
    $contract = Contract::factory()->create();

    $this->actingAs(User::factory()->create())
        ->deleteJson("/api/contracts/{$contract->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('contracts', ['id' => $contract->id]);
});
