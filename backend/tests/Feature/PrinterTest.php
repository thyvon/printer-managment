<?php

use App\Models\Printer;
use App\Models\Site;
use App\Models\User;

it('lists printers', function () {
    Printer::factory()->count(2)->create();

    $this->actingAs(User::factory()->create())
        ->getJson('/api/printers')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('creates a printer under a site', function () {
    $site = Site::factory()->create();

    $this->actingAs(User::factory()->create())
        ->postJson('/api/printers', [
            'site_id' => $site->id,
            'name' => 'Reception Printer',
            'manufacturer' => 'Canon',
            'ip_address' => '192.168.1.50',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Reception Printer')
        ->assertJsonPath('data.site_id', $site->id);
});

it('validates site exists on create', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/printers', [
            'site_id' => 9999,
            'name' => 'Orphan Printer',
        ])
        ->assertUnprocessable();
});

it('updates a printer', function () {
    $printer = Printer::factory()->create();

    $this->actingAs(User::factory()->create())
        ->patchJson("/api/printers/{$printer->id}", ['status' => 'maintenance'])
        ->assertOk()
        ->assertJsonPath('data.status', 'maintenance');
});

it('deletes a printer', function () {
    $printer = Printer::factory()->create();

    $this->actingAs(User::factory()->create())
        ->deleteJson("/api/printers/{$printer->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('printers', ['id' => $printer->id]);
});
