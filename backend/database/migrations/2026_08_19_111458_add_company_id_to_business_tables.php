<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'users',
            'customers',
            'sites',
            'contacts',
            'printers',
            'contracts',
            'pricing_tiers',
            'collectors',
            'counter_readings',
            'usages',
            'invoices',
            'invoice_lines',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('company_id')->nullable()->constrained('companies')->cascadeOnDelete()->after('id');
                $t->index('company_id');
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'users',
            'customers',
            'sites',
            'contacts',
            'printers',
            'contracts',
            'pricing_tiers',
            'collectors',
            'counter_readings',
            'usages',
            'invoices',
            'invoice_lines',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropConstrainedForeignId('company_id');
            });
        }
    }
};
