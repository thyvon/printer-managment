<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Models\Collector;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Printer;
use App\Models\ServiceTicket;
use App\Models\Site;
use App\Models\Toner;
use App\Models\User;
use App\Observers\AuditLogObserver;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
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
        $this->observeAuthEvents();
    }

    private function observeModels(): void
    {
        $models = [
            Contact::class,
            Contract::class,
            Collector::class,
            Customer::class,
            Invoice::class,
            Printer::class,
            ServiceTicket::class,
            Site::class,
            Toner::class,
            User::class,
        ];

        foreach ($models as $model) {
            $model::observe(AuditLogObserver::class);
        }
    }

    private function observeAuthEvents(): void
    {
        Event::listen(Login::class, function (Login $event) {
            $user = $event->user;
            $request = request();

            AuditLog::create([
                'company_id' => $user->company_id,
                'user_id' => $user->id,
                'auditable_type' => get_class($user),
                'auditable_id' => $user->id,
                'event' => 'login',
                'old_values' => [],
                'new_values' => ['email' => $user->email],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        Event::listen(Logout::class, function (Logout $event) {
            $user = $event->user;
            $request = request();

            if ($user) {
                AuditLog::create([
                    'company_id' => $user->company_id,
                    'user_id' => $user->id,
                    'auditable_type' => get_class($user),
                    'auditable_id' => $user->id,
                    'event' => 'logout',
                    'old_values' => [],
                    'new_values' => ['email' => $user->email],
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }
        });
    }
}
