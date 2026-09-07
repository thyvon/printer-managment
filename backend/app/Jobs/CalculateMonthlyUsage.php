<?php

namespace App\Jobs;

use App\Models\Company;
use App\Services\UsageCalculator;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

use function setTenantCompany;

class CalculateMonthlyUsage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $companyId,
        public string $month,
    ) {
        $this->onQueue('usage');
    }

    public function handle(UsageCalculator $calculator): void
    {
        setTenantCompany($this->companyId);

        $month = Carbon::parse($this->month.'-01');
        $calculator->calculateForMonth($month);

        setTenantCompany(null);
    }

    public static function dispatchForAllTenants(string $month): void
    {
        foreach (Company::all() as $company) {
            static::dispatch($company->id, $month);
        }
    }
}
