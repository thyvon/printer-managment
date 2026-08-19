<?php

namespace Database\Seeders;

use App\Models\Collector;
use App\Models\Company;
use App\Models\Contract;
use App\Models\CounterReading;
use App\Models\Customer;
use App\Models\PricingTier;
use App\Models\Printer;
use App\Models\Site;
use App\Models\User;
use Illuminate\Database\Seeder;

use function setTenantCompany;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::factory()->create([
            'name' => 'Demo Rentals',
        ]);

        setTenantCompany($company->id);

        User::factory()->create([
            'company_id' => $company->id,
            'name' => 'Demo Admin',
            'email' => 'admin@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $customer = Customer::factory()->create(['company_id' => $company->id]);
        $site = Site::factory()->create(['customer_id' => $customer->id, 'company_id' => $company->id]);
        $printer = Printer::factory()->create(['site_id' => $site->id, 'company_id' => $company->id]);
        $collector = Collector::factory()->create(['site_id' => $site->id, 'company_id' => $company->id]);

        CounterReading::factory()->create([
            'collector_id' => $collector->id,
            'printer_id' => $printer->id,
            'company_id' => $company->id,
            'read_at' => now()->subMonths(2)->endOfMonth(),
        ]);

        CounterReading::factory()->create([
            'collector_id' => $collector->id,
            'printer_id' => $printer->id,
            'company_id' => $company->id,
            'read_at' => now()->subMonth()->endOfMonth(),
        ]);

        $contract = Contract::factory()->create([
            'customer_id' => $customer->id,
            'company_id' => $company->id,
            'status' => 'active',
            'monthly_fee' => 100,
        ]);

        PricingTier::factory()->create([
            'contract_id' => $contract->id,
            'company_id' => $company->id,
            'currency' => 'USD',
            'included_mono_pages' => 1000,
            'included_color_pages' => 500,
            'mono_rate' => 0.05,
            'color_rate' => 0.30,
        ]);

        setTenantCompany(null);
    }
}
