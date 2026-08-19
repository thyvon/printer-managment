<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\UsageCalculator;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

use function setTenantCompany;

#[Signature('usage:calculate {--month= : YYYY-MM to calculate; defaults to last month}')]
#[Description('Calculate monthly usage from counter reading deltas')]
class CalculateMonthlyUsage extends Command
{
    public function handle(UsageCalculator $calculator): int
    {
        $month = $this->option('month')
            ? Carbon::parse($this->option('month').'-01')
            : now()->subMonth()->startOfMonth();

        $total = 0;

        foreach (Company::all() as $company) {
            setTenantCompany($company->id);
            $usages = $calculator->calculateForMonth($month);
            $total += $usages->count();
        }

        setTenantCompany(null);

        $this->info("Calculated usage for {$month->format('Y-m')} ({$total} records).");

        return self::SUCCESS;
    }
}
