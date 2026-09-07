<?php

namespace App\Jobs;

use App\Models\Company;
use App\Services\InvoicingService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

use function setTenantCompany;

class GenerateMonthlyInvoices implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $companyId,
        public string $month,
    ) {
        $this->onQueue('invoices');
    }

    public function handle(InvoicingService $service): void
    {
        setTenantCompany($this->companyId);

        $company = Company::find($this->companyId);
        $month = Carbon::parse($this->month.'-01');

        foreach ($company->customers as $customer) {
            try {
                $service->generate($customer, $month);
            } catch (\Throwable $e) {
                Log::error('Invoice generation failed', [
                    'company_id' => $this->companyId,
                    'customer_id' => $customer->id,
                    'month' => $this->month,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        setTenantCompany(null);
    }

    public static function dispatchForAllTenants(string $month): void
    {
        foreach (Company::all() as $company) {
            static::dispatch($company->id, $month);
        }
    }
}
