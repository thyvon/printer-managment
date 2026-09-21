<?php

namespace App\Providers;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Printer;
use App\Models\ServiceTicket;
use App\Models\Site;
use App\Models\Toner;
use App\Observers\AuditLogObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->observeModels();
    }

    private function observeModels(): void
    {
        $models = [
            Customer::class,
            Site::class,
            Printer::class,
            Invoice::class,
            Toner::class,
            ServiceTicket::class,
        ];

        foreach ($models as $model) {
            $model::observe(AuditLogObserver::class);
        }
    }
}
