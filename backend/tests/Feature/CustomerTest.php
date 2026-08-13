<?php

use App\Models\Customer;
use App\Models\User;

it('lists customers', function () {
    Customer::factory()->count(3)->create();

    $this->actingAs(User::factory()->create())
        ->getJson('/api/customers')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('creates a customer', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/customers', [
            'name' => 'ABC Rentals',
            'currency' => 'USD',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'ABC Rentals');

    expect(Customer::where('name', 'ABC Rentals')->exists())->toBeTrue();
});

it('validates currency on create', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/customers', [
            'name' => 'Bad Currency',
            'currency' => 'EUR',
        ])
        ->assertUnprocessable();
});

it('requires authentication to access customers', function () {
    $this->getJson('/api/customers')->assertStatus(401);
});

it('shows a customer with its sites', function () {
    $customer = Customer::factory()->hasSites(2)->create();

    $this->actingAs(User::factory()->create())
        ->getJson("/api/customers/{$customer->id}")
        ->assertOk()
        ->assertJsonPath('data.sites_count', 2)
        ->assertJsonCount(2, 'data.sites');
});

it('updates a customer', function () {
    $customer = Customer::factory()->create();

    $this->actingAs(User::factory()->create())
        ->patchJson("/api/customers/{$customer->id}", ['name' => 'Renamed'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed');
});

it('deletes a customer', function () {
    $customer = Customer::factory()->create();

    $this->actingAs(User::factory()->create())
        ->deleteJson("/api/customers/{$customer->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('customers', ['id' => $customer->id]);
});
