<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounterReading;
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

        $sitePrinterIds = $collector->site
            ? $collector->site->printers()->pluck('id')->all()
            : [];

        foreach ($data['readings'] as $reading) {
            if ($collector->site_id && ! in_array($reading['printer_id'], $sitePrinterIds)) {
                throw ValidationException::withMessages([
                    'readings.*.printer_id' => "Printer {$reading['printer_id']} does not belong to this collector's site.",
                ]);
            }

            CounterReading::create([
                'collector_id' => $collector->id,
                'printer_id' => $reading['printer_id'],
                'total_pages' => $reading['total_pages'],
                'mono_pages' => $reading['mono_pages'] ?? 0,
                'color_pages' => $reading['color_pages'] ?? 0,
                'read_at' => $reading['read_at'] ?? now(),
            ]);
        }

        return response()->json([
            'message' => 'stored',
            'count' => count($data['readings']),
        ]);
    }
}
