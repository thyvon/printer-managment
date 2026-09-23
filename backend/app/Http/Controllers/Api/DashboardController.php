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
use App\Models\ServiceTicket;
use App\Models\Site;
use App\Models\Toner;
use App\Models\Usage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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

        $lowStockToners = Toner::where('current_stock', '<=', DB::raw('low_stock_threshold'))
            ->latest()
            ->limit(5)
            ->get();

        $openTickets = ServiceTicket::whereIn('status', ['open', 'assigned', 'in_progress'])
            ->with('customer', 'printer')
            ->latest()
            ->limit(5)
            ->get();

        $lowTonerPrinters = Printer::whereNotNull('toner_levels')
            ->with('site.customer')
            ->get()
            ->filter(function (Printer $p) {
                foreach ($p->toner_levels as $level) {
                    if (isset($level['percent']) && $level['percent'] <= 20) {
                        return true;
                    }
                }
                return false;
            })
            ->take(5)
            ->values();

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
            'low_stock_toners' => $lowStockToners->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'part_number' => $t->part_number,
                'color' => $t->color,
                'current_stock' => $t->current_stock,
                'low_stock_threshold' => $t->low_stock_threshold,
                'unit' => $t->unit,
            ]),
            'open_tickets' => $openTickets->map(fn ($t) => [
                'id' => $t->id,
                'title' => $t->title,
                'status' => $t->status,
                'priority' => $t->priority,
                'customer_name' => $t->customer?->name,
                'printer_name' => $t->printer?->name,
                'scheduled_at' => $t->scheduled_at?->toIso8601String(),
            ]),
            'low_toner_printers' => $lowTonerPrinters->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'site_name' => $p->site?->name,
                'customer_name' => $p->site?->customer?->name,
                'toner_levels' => $p->toner_levels,
            ]),
        ]);
    }
}
