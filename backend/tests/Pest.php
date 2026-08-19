<?php

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature');
uses(TestCase::class)->in('Unit');

/**
 * Create a company + owner user, authenticate as that user,
 * and return the company so tests can scope their data to it.
 */
function makeTenant(array $userOverrides = [], array $companyOverrides = []): Company
{
    $company = Company::factory()->create($companyOverrides);
    $user = User::factory()->create(array_merge([
        'company_id' => $company->id,
        'role' => 'admin',
    ], $userOverrides));

    test()->actingAs($user);

    return $company;
}
