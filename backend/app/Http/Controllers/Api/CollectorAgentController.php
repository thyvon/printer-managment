<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessCounterReadings;
use App\Models\Printer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CollectorAgentController extends Controller
{
    public function heartbeat(Request $request): JsonResponse
    {
        $collector = $request->get('collector');

        $data = $request->validate([
            'version' => ['nullable', 'string', 'max:20'],
        ]);

        $collector->forceFill([
            'version' => $data['version'] ?? $collector->version,
            'last_seen_at' => now(),
            'status' => 'active',
        ])->save();

        return response()->json([
            'message' => 'ok',
            'collector_id' => $collector->id,
            'status' => 'active',
        ]);
    }

    public function readings(Request $request): JsonResponse
    {
        $collector = $request->get('collector');

        $data = $request->validate([
            'readings' => ['required', 'array', 'min:1'],
            'readings.*.printer_id' => ['required', 'exists:printers,id'],
            'readings.*.total_pages' => ['required', 'integer', 'min:0'],
            'readings.*.mono_pages' => ['nullable', 'integer', 'min:0'],
            'readings.*.color_pages' => ['nullable', 'integer', 'min:0'],
            'readings.*.read_at' => ['nullable', 'date'],
        ]);

        if ($collector->site_id) {
            $sitePrinterIds = Printer::where('site_id', $collector->site_id)->pluck('id')->all();

            foreach ($data['readings'] as $reading) {
                if (! in_array($reading['printer_id'], $sitePrinterIds)) {
                    throw ValidationException::withMessages([
                        'readings.*.printer_id' => "Printer {$reading['printer_id']} does not belong to this collector's site.",
                    ]);
                }
            }
        }

        ProcessCounterReadings::dispatch(
            $collector->id,
            $collector->site_id,
            $data['readings']
        );

        return response()->json([
            'message' => 'queued',
            'count' => count($data['readings']),
        ]);
    }

    public function tonerLevels(Request $request): JsonResponse
    {
        $collector = $request->get('collector');

        $data = $request->validate([
            'levels' => ['required', 'array', 'min:1'],
            'levels.*.printer_id' => ['required', 'exists:printers,id'],
            'levels.*.toner_levels' => ['required', 'array'],
            'levels.*.toner_levels.*.color' => ['required', 'string', 'in:black,cyan,magenta,yellow'],
            'levels.*.toner_levels.*.current' => ['required', 'integer', 'min:0'],
            'levels.*.toner_levels.*.max' => ['required', 'integer', 'min:1'],
        ]);

        if ($collector->site_id) {
            $sitePrinterIds = Printer::where('site_id', $collector->site_id)->pluck('id')->all();

            foreach ($data['levels'] as $item) {
                if (! in_array($item['printer_id'], $sitePrinterIds)) {
                    throw ValidationException::withMessages([
                        'levels.*.printer_id' => "Printer {$item['printer_id']} does not belong to this collector's site.",
                    ]);
                }
            }
        }

        foreach ($data['levels'] as $item) {
            $printer = Printer::findOrFail($item['printer_id']);

            $tonerLevels = collect($item['toner_levels'])->mapWithKeys(function ($t) {
                $percent = $t['max'] > 0 ? round(($t['current'] / $t['max']) * 100) : 0;

                return [$t['color'] => [
                    'current' => $t['current'],
                    'max' => $t['max'],
                    'percent' => $percent,
                ]];
            })->toArray();

            $printer->update(['toner_levels' => $tonerLevels]);
        }

        return response()->json([
            'message' => 'ok',
            'count' => count($data['levels']),
        ]);
    }
}
