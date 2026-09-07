<?php

namespace App\Console\Commands;

use App\Jobs\GenerateMonthlyInvoices as GenerateMonthlyInvoicesJob;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('invoices:generate {--month= : YYYY-MM to invoice; defaults to last month}')]
#[Description('Dispatch invoice generation jobs for all tenants')]
class GenerateMonthlyInvoices extends Command
{
    public function handle(): int
    {
        $month = $this->option('month')
            ? Carbon::parse($this->option('month').'-01')
            : now()->subMonth()->startOfMonth();

        GenerateMonthlyInvoicesJob::dispatchForAllTenants($month->format('Y-m'));

        $this->info("Dispatched invoice generation jobs for {$month->format('Y-m')}.");

        return self::SUCCESS;
    }
}
