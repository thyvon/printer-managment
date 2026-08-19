<?php

use App\Models\Customer;

it('lists customers scoped to the tenant', function () {
    $company = makeTenant();
    Customer::factory()->count(3)->create(['company_id' => $company->id]);
    Customer::factory()->count(2)->create();

    $this->getJson('/api/customers')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('creates a customer', function () {
    makeTenant();

    $this->postJson('/api/customers', [
        'name' => 'ABC Rentals',
        'currency' => 'USD',
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'ABC Rentals');

    expect(Customer::where('name', 'ABC Rentals')->exists())->toBeTrue();
});

it('validates currency on create', function () {
    makeTenant();

    $this->postJson('/api/customers', [
        'name' => 'Bad Currency',
        'currency' => 'EUR',
    ])->assertUnprocessable();
});

it('requires authentication to access customers', function () {
    $this->getJson('/api/customers')->assertStatus(401);
});

it('shows a customer with its sites', function () {
    $company = makeTenant();
    $customer = Customer::factory()->hasSites(2, ['company_id' => $company->id])
        ->create(['company_id' => $company->id]);

    $this->getJson("/api/customers/{$customer->id}")
        ->assertOk()
        ->assertJsonPath('data.sites_count', 2)
        ->assertJsonCount(2, 'data.sites');
});

it('cannot access another tenants customer', function () {
    $company = makeTenant();
    $foreign = Customer::factory()->create();

    $this->getJson("/api/customers/{$foreign->id}")
        ->assertNotFound();
});

it('updates a customer', function () {
    $company = makeTenant();
    $customer = Customer::factory()->create(['company_id' => $company->id]);

    $this->patchJson("/api/customers/{$customer->id}", ['name' => 'Renamed'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed');
});

it('deletes a customer', function () {
    $company = makeTenant();
    $customer = Customer::factory()->create(['company_id' => $company->id]);

    $this->deleteJson("/api/customers/{$customer->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('customers', ['id' => $customer->id]);
});
