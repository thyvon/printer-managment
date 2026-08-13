<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Services\InvoicingService;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('invoices:generate {--month= : YYYY-MM to invoice; defaults to last month}')]
#[Description('Generate invoices for all customers with an active contract')]
class GenerateMonthlyInvoices extends Command
{
    public function handle(InvoicingService $service): int
    {
        $month = $this->option('month')
            ? Carbon::parse($this->option('month').'-01')
            : now()->subMonth()->startOfMonth();

        $customers = Customer::whereHas('contracts', fn ($q) => $q->where('status', 'active'))->get();

        $count = 0;
        foreach ($customers as $customer) {
            try {
                $service->generate($customer, $month);
                $count++;
            } catch (\Throwable $e) {
                $this->error("Customer {$customer->id}: {$e->getMessage()}");
            }
        }

        $this->info("Generated {$count} invoice(s) for {$month->format('Y-m')}.");

        return self::SUCCESS;
    }
}
