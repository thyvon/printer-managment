<?php

use App\Models\Collector;
use App\Models\Site;

it('registers a collector and returns its token', function () {
    $company = makeTenant();
    $site = Site::factory()->create(['company_id' => $company->id]);

    $response = $this->postJson('/api/collectors', [
        'site_id' => $site->id,
        'name' => 'Site Collector',
    ])
        ->assertCreated()
        ->assertJsonStructure(['data', 'token']);

    $collector = Collector::where('name', 'Site Collector')->first();

    expect($collector)->not->toBeNull()
        ->and($collector->company_id)->toBe($company->id)
        ->and(strlen($response->json('token')))->toBe(64);
});

it('token is not exposed in the resource', function () {
    $company = makeTenant();
    $collector = Collector::factory()->create(['company_id' => $company->id]);

    $this->getJson("/api/collectors/{$collector->id}")
        ->assertOk()
        ->assertJsonMissing(['token' => $collector->token]);
});

it('requires a valid site on register', function () {
    makeTenant();

    $this->postJson('/api/collectors', [
        'site_id' => 9999,
        'name' => 'Orphan',
    ])->assertUnprocessable();
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
