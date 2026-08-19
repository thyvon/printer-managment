<?php

use App\Models\Company;
use App\Models\User;

it('registers a company and owner user, returning a token', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Vun Thy',
        'email' => 'admin@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'company_name' => 'ABC Rentals',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['user', 'company', 'token'])
        ->assertJsonPath('company.name', 'ABC Rentals');

    $user = User::where('email', 'admin@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe('admin')
        ->and($user->company_id)->not->toBeNull()
        ->and($user->company->name)->toBe('ABC Rentals');
});

it('requires a company name on register', function () {
    $this->postJson('/api/register', [
        'name' => 'Vun Thy',
        'email' => 'admin2@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertUnprocessable();
});

it('logs in with valid credentials', function () {
    $user = User::factory()->create(['password' => 'secret123']);

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'secret123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure(['user', 'token']);
});

it('rejects invalid credentials', function () {
    User::factory()->create(['email' => 'a@b.com', 'password' => 'secret123']);

    $this->postJson('/api/login', [
        'email' => 'a@b.com',
        'password' => 'wrong',
    ])->assertStatus(422);
});

it('requires authentication to access the user endpoint', function () {
    $this->getJson('/api/user')->assertStatus(401);
});

it('creates a unique tenant slug', function () {
    $company = Company::factory()->create(['name' => 'ABC Rentals']);

    expect($company->slug)->toContain('abc-rentals');
});
