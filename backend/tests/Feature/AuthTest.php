<?php

use App\Models\User;

it('registers a user and returns a token', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Vun Thy',
        'email' => 'admin@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['user', 'token']);

    expect(User::where('email', 'admin@example.com')->exists())->toBeTrue();
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
