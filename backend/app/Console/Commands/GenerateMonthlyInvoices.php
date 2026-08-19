<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\InvoicingService;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

use function setTenantCompany;

#[Signature('invoices:generate {--month= : YYYY-MM to invoice; defaults to last month}')]
#[Description('Generate invoices for all customers across every tenant')]
class GenerateMonthlyInvoices extends Command
{
    public function handle(InvoicingService $service): int
    {
        $month = $this->option('month')
            ? Carbon::parse($this->option('month').'-01')
            : now()->subMonth()->startOfMonth();

        $count = 0;

        foreach (Company::all() as $company) {
            setTenantCompany($company->id);

            foreach ($company->customers as $customer) {
                try {
                    $service->generate($customer, $month);
                    $count++;
                } catch (\Throwable $e) {
                    $this->error("Customer {$customer->id}: {$e->getMessage()}");
                }
            }
        }

        setTenantCompany(null);

        $this->info("Generated {$count} invoice(s) for {$month->format('Y-m')}.");

        return self::SUCCESS;
    }
}
