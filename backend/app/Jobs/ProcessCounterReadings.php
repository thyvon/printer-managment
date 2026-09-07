<?php

namespace App\Jobs;

use App\Models\CounterReading;
use App\Models\Printer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCounterReadings implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $attempts = 3;

    public function __construct(
        public int $collectorId,
        public int $siteId,
        public array $readings,
    ) {
        $this->onQueue('readings');
    }

    public function handle(): void
    {
        $sitePrinterIds = Printer::where('site_id', $this->siteId)->pluck('id')->all();

        foreach ($this->readings as $reading) {
            if (! in_array($reading['printer_id'], $sitePrinterIds)) {
                Log::warning("Printer {$reading['printer_id']} not in collector's site", [
                    'collector_id' => $this->collectorId,
                    'site_id' => $this->siteId,
                ]);

                continue;
            }

            CounterReading::create([
                'collector_id' => $this->collectorId,
                'printer_id' => $reading['printer_id'],
                'total_pages' => $reading['total_pages'],
                'mono_pages' => $reading['mono_pages'] ?? 0,
                'color_pages' => $reading['color_pages'] ?? 0,
                'read_at' => $reading['read_at'] ?? now(),
            ]);
        }
    }
}
