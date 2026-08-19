<?php

use App\Models\Printer;
use App\Models\Site;

it('lists printers scoped to the tenant', function () {
    $company = makeTenant();
    Printer::factory()->count(2)->create(['company_id' => $company->id]);
    Printer::factory()->count(3)->create();

    $this->getJson('/api/printers')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('creates a printer under a site', function () {
    $company = makeTenant();
    $site = Site::factory()->create(['company_id' => $company->id]);

    $this->postJson('/api/printers', [
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
    makeTenant();

    $this->postJson('/api/printers', [
        'site_id' => 9999,
        'name' => 'Orphan Printer',
    ])->assertUnprocessable();
});

it('cannot create a printer under another tenants site', function () {
    makeTenant();
    $foreignSite = Site::factory()->create();

    $this->postJson('/api/printers', [
        'site_id' => $foreignSite->id,
        'name' => 'Sneaky Printer',
    ])->assertStatus(422);
});

it('updates a printer', function () {
    $company = makeTenant();
    $printer = Printer::factory()->create(['company_id' => $company->id]);

    $this->patchJson("/api/printers/{$printer->id}", ['status' => 'maintenance'])
        ->assertOk()
        ->assertJsonPath('data.status', 'maintenance');
});

it('deletes a printer', function () {
    $company = makeTenant();
    $printer = Printer::factory()->create(['company_id' => $company->id]);

    $this->deleteJson("/api/printers/{$printer->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('printers', ['id' => $printer->id]);
});
