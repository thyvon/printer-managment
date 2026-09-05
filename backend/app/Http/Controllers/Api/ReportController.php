<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Printer;
use App\Models\ServiceTicket;
use App\Models\Toner;
use App\Models\Usage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function usage(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'printer_id' => 'nullable|integer|exists:printers,id',
            'customer_id' => 'nullable|integer|exists:customers,id',
        ]);

        $query = Usage::query()
            ->with('printer')
            ->select(
                'period_start',
                'period_end',
                DB::raw('SUM(total_pages) as total_pages'),
                DB::raw('SUM(mono_pages) as mono_pages'),
                DB::raw('SUM(color_pages) as color_pages'),
                DB::raw('COUNT(DISTINCT printer_id) as printer_count')
            )
            ->groupBy('period_start', 'period_end')
            ->orderBy('period_start');

        if ($request->filled('from')) {
            $query->where('period_start', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('period_end', '<=', $request->to);
        }
        if ($request->filled('printer_id')) {
            $query->where('printer_id', $request->printer_id);
        }
        if ($request->filled('customer_id')) {
            $query->whereHas('printer.site', fn ($q) => $q->where('customer_id', $request->customer_id));
        }

        $data = $query->get();

        $summary = [
            'total_pages' => $data->sum('total_pages'),
            'total_mono' => $data->sum('mono_pages'),
            'total_color' => $data->sum('color_pages'),
            'avg_pages_per_printer' => $data->avg('printer_count') > 0
                ? round($data->sum('total_pages') / $data->avg('printer_count'))
                : 0,
            'periods' => $data->map(fn ($row) => [
                'period_start' => $row->period_start,
                'period_end' => $row->period_end,
                'total_pages' => (int) $row->total_pages,
                'mono_pages' => (int) $row->mono_pages,
                'color_pages' => (int) $row->color_pages,
                'printer_count' => (int) $row->printer_count,
            ]),
        ];

        return response()->json($summary);
    }

    public function revenue(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
            'customer_id' => 'nullable|integer|exists:customers,id',
            'status' => 'nullable|string|in:draft,sent,paid,overdue,void',
        ]);

        $query = Invoice::query()
            ->with('customer')
            ->select(
                'period_start',
                'period_end',
                'currency',
                DB::raw('SUM(total) as total'),
                DB::raw('SUM(subtotal) as subtotal'),
                DB::raw('SUM(tax) as tax'),
                DB::raw('COUNT(*) as invoice_count'),
                DB::raw("COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count"),
                DB::raw("COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count")
            )
            ->groupBy('period_start', 'period_end', 'currency')
            ->orderBy('period_start');

        if ($request->filled('from')) {
            $query->where('period_start', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('period_end', '<=', $request->to);
        }
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $data = $query->get();

        $summary = [
            'total_revenue_usd' => (float) $data->where('currency', 'USD')->sum('total'),
            'total_revenue_khr' => (float) $data->where('currency', 'KHR')->sum('total'),
            'total_subtotal_usd' => (float) $data->where('currency', 'USD')->sum('subtotal'),
            'total_subtotal_khr' => (float) $data->where('currency', 'KHR')->sum('subtotal'),
            'total_tax_usd' => (float) $data->where('currency', 'USD')->sum('tax'),
            'total_tax_khr' => (float) $data->where('currency', 'KHR')->sum('tax'),
            'total_invoices' => $data->sum('invoice_count'),
            'paid_invoices' => $data->sum('paid_count'),
            'overdue_invoices' => $data->sum('overdue_count'),
            'periods' => $data->map(fn ($row) => [
                'period_start' => $row->period_start,
                'period_end' => $row->period_end,
                'currency' => $row->currency,
                'total' => (float) $row->total,
                'subtotal' => (float) $row->subtotal,
                'tax' => (float) $row->tax,
                'invoice_count' => (int) $row->invoice_count,
                'paid_count' => (int) $row->paid_count,
                'overdue_count' => (int) $row->overdue_count,
            ]),
        ];

        return response()->json($summary);
    }

    public function fleet(): JsonResponse
    {
        $printers = Printer::query()
            ->select(
                'status',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('status')
            ->get();

        $byManufacturer = Printer::query()
            ->select(
                'manufacturer',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('manufacturer')
            ->orderByDesc('count')
            ->get();

        $byCustomer = Printer::query()
            ->join('sites', 'printers.site_id', '=', 'sites.id')
            ->join('customers', 'sites.customer_id', '=', 'customers.id')
            ->select(
                'customers.name as customer_name',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('customers.name')
            ->orderByDesc('count')
            ->get();

        $bySite = Printer::query()
            ->join('sites', 'printers.site_id', '=', 'sites.id')
            ->select(
                'sites.name as site_name',
                'sites.city',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('sites.name', 'sites.city')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $lowStockToners = Toner::query()
            ->whereRaw('current_stock <= low_stock_threshold')
            ->count();

        $openTickets = ServiceTicket::query()
            ->whereIn('status', ['open', 'assigned', 'in_progress'])
            ->count();

        return response()->json([
            'total_printers' => Printer::count(),
            'by_status' => $printers->map(fn ($r) => [
                'status' => $r->status,
                'count' => (int) $r->count,
            ]),
            'by_manufacturer' => $byManufacturer->map(fn ($r) => [
                'manufacturer' => $r->manufacturer ?? 'Unknown',
                'count' => (int) $r->count,
            ]),
            'by_customer' => $byCustomer->map(fn ($r) => [
                'customer' => $r->customer_name,
                'count' => (int) $r->count,
            ]),
            'by_site' => $bySite->map(fn ($r) => [
                'site' => $r->site_name,
                'city' => $r->city,
                'count' => (int) $r->count,
            ]),
            'low_stock_toners' => $lowStockToners,
            'open_tickets' => $openTickets,
        ]);
    }
}
