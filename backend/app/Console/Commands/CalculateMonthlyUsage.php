<?php

namespace App\Console\Commands;

use App\Jobs\CalculateMonthlyUsage as CalculateMonthlyUsageJob;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('usage:calculate {--month= : YYYY-MM to calculate; defaults to last month}')]
#[Description('Dispatch usage calculation jobs for all tenants')]
class CalculateMonthlyUsage extends Command
{
    public function handle(): int
    {
        $month = $this->option('month')
            ? Carbon::parse($this->option('month').'-01')
            : now()->subMonth()->startOfMonth();

        CalculateMonthlyUsageJob::dispatchForAllTenants($month->format('Y-m'));

        $this->info("Dispatched usage calculation jobs for {$month->format('Y-m')}.");

        return self::SUCCESS;
    }
}
