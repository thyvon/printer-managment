<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'customers' => ['view', 'create', 'update', 'delete'],
            'sites' => ['view', 'create', 'update', 'delete'],
            'contacts' => ['view', 'create', 'update', 'delete'],
            'printers' => ['view', 'create', 'update', 'delete'],
            'collectors' => ['view', 'create', 'update', 'delete'],
            'contracts' => ['view', 'create', 'update', 'delete'],
            'invoices' => ['view', 'create', 'update', 'delete'],
            'toners' => ['view', 'create', 'update', 'delete'],
            'service_tickets' => ['view', 'create', 'update', 'delete'],
            'users' => ['view', 'create', 'update', 'delete'],
            'reports' => ['view'],
            'settings' => ['view', 'update'],
        ];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['name' => "{$module}.{$action}"],
                    ['group' => $module]
                );
            }
        }
    }
}
