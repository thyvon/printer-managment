<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\PrinterResource;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Printer;
use App\Models\Site;
use App\Models\Usage;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function summary()
    {
        $thisMonth = now()->startOfMonth();

        $invoicesThisMonth = Invoice::where('created_at', '>=', $thisMonth)
            ->where('status', '!=', 'void')
            ->get();

        $trendStart = now()->subMonths(5)->startOfMonth();

        $usageRows = Usage::where('period_start', '>=', $trendStart)->get();

        $usageTrend = $usageRows
            ->groupBy(fn ($row) => Carbon::parse($row->period_start)->format('Y-m'))
            ->map(function ($rows, $month) {
                return [
                    'month' => $month,
                    'total_pages' => (int) $rows->sum('total_pages'),
                    'mono_pages' => (int) $rows->sum('mono_pages'),
                    'color_pages' => (int) $rows->sum('color_pages'),
                ];
            })
            ->sortKeys()
            ->values();

        $recentInvoices = Invoice::with('customer')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'counts' => [
                'customers' => Customer::count(),
                'sites' => Site::count(),
                'printers' => Printer::count(),
                'active_contracts' => Contract::where('status', 'active')->count(),
            ],
            'invoices_this_month' => [
                'count' => $invoicesThisMonth->count(),
                'total' => round($invoicesThisMonth->sum('total'), 2),
            ],
            'usage_trend' => $usageTrend,
            'recent_invoices' => InvoiceResource::collection($recentInvoices),
            'printers' => PrinterResource::collection(Printer::with('site')->latest()->limit(5)->get()),
            'customers' => CustomerResource::collection(Customer::withCount('sites')->latest()->limit(5)->get()),
        ]);
    }
}
