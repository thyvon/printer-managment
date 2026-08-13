<?php

namespace App\Services;

use App\Models\CounterReading;
use App\Models\Printer;
use App\Models\Usage;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class UsageCalculator
{
    /**
     * Calculate usage for a single printer between two dates (inclusive).
     *
     * Uses the reading at or before the period start as the opening baseline
     * and the last reading within the period as the closing value. The delta
     * is the usage for that period. Negative deltas (counter resets) are
     * clamped to zero per page type.
     */
    public function calculateForPrinter(Printer $printer, Carbon $start, Carbon $end): ?Usage
    {
        $endOfDay = $end->copy()->endOfDay();

        $baseline = CounterReading::where('printer_id', $printer->id)
            ->where('read_at', '<=', $start->copy()->startOfDay())
            ->latest('read_at')
            ->first();

        $closing = CounterReading::where('printer_id', $printer->id)
            ->whereBetween('read_at', [$start->copy()->startOfDay(), $endOfDay])
            ->latest('read_at')
            ->first();

        if (! $closing) {
            return null;
        }

        if ($baseline) {
            $total = max(0, $closing->total_pages - $baseline->total_pages);
            $mono = max(0, $closing->mono_pages - $baseline->mono_pages);
            $color = max(0, $closing->color_pages - $baseline->color_pages);
        } else {
            $total = $closing->total_pages;
            $mono = $closing->mono_pages;
            $color = $closing->color_pages;
        }

        return Usage::updateOrCreate(
            [
                'printer_id' => $printer->id,
                'period_start' => $start->startOfDay(),
                'period_end' => $end->endOfDay(),
            ],
            [
                'start_reading_id' => $baseline?->id,
                'end_reading_id' => $closing->id,
                'total_pages' => $total,
                'mono_pages' => $mono,
                'color_pages' => $color,
            ]
        );
    }

    /**
     * Calculate usage for a whole month across one or many printers.
     *
     * @return Collection<int, Usage>
     */
    public function calculateForMonth(
        Carbon $month,
        ?Collection $printers = null
    ): Collection {
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();

        $printers = $printers ?: Printer::query()->get();

        return $printers->map(fn (Printer $printer) => $this->calculateForPrinter($printer, $start, $end))
            ->filter()
            ->values();
    }
}
