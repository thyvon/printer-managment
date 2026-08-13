<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('usage:calculate')
    ->monthlyOn(1, '02:00')
    ->description('Calculate monthly usage after month-end readings');

Schedule::command('invoices:generate')
    ->monthlyOn(1, '03:00')
    ->description('Generate monthly invoices from calculated usage');
