<?php

use App\Models\Collector;
use App\Models\Site;
use App\Models\User;

it('registers a collector and returns its token', function () {
    $site = Site::factory()->create();

    $response = $this->actingAs(User::factory()->create())
        ->postJson('/api/collectors', [
            'site_id' => $site->id,
            'name' => 'Site Collector',
        ])
        ->assertCreated()
        ->assertJsonStructure(['data', 'token']);

    expect(Collector::where('name', 'Site Collector')->exists())->toBeTrue()
        ->and(strlen($response->json('token')))->toBe(64);
});

it('token is not exposed in the resource', function () {
    $collector = Collector::factory()->create();

    $this->actingAs(User::factory()->create())
        ->getJson("/api/collectors/{$collector->id}")
        ->assertOk()
        ->assertJsonMissing(['token' => $collector->token]);
});

it('requires a valid site on register', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/collectors', [
            'site_id' => 9999,
            'name' => 'Orphan',
        ])
        ->assertUnprocessable();
});

it('rejects heartbeat with an invalid token', function () {
    $this->postJson('/api/collector/heartbeat', [], ['Authorization' => 'Bearer nope'])
        ->assertStatus(401);
});

it('accepts a heartbeat with a valid token', function () {
    $collector = Collector::factory()->create(['status' => 'inactive']);

    $this->postJson('/api/collector/heartbeat', [
        'version' => '1.2.3',
    ], ['Authorization' => "Bearer {$collector->token}"])
        ->assertOk()
        ->assertJsonPath('status', 'active');

    $collector->refresh();

    expect($collector->status)->toBe('active')
        ->and($collector->version)->toBe('1.2.3')
        ->and($collector->last_seen_at)->not->toBeNull();
});

it('requires authentication for admin collector endpoints', function () {
    $this->getJson('/api/collectors')->assertStatus(401);
});
