<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Customer;
use App\Models\Invoice;
use App\Services\InvoicingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Spatie\LaravelPdf\Facades\Pdf;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with('customer', 'lines')->latest();

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->query('customer_id'));
        }

        return InvoiceResource::collection($query->paginate(request()->integer('per_page', 15)));
    }

    public function show(Invoice $invoice)
    {
        return new InvoiceResource($invoice->load('customer', 'lines'));
    }

    public function generate(Request $request, InvoicingService $service)
    {
        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $invoice = $service->generate(
            Customer::findOrFail($data['customer_id']),
            Carbon::parse($data['month'].'-01')
        );

        return new InvoiceResource($invoice->load('customer', 'lines'));
    }

    public function pdf(Invoice $invoice)
    {
        $invoice->load('customer', 'lines');

        return Pdf::view('invoice.pdf', compact('invoice'))
            ->format('a4')
            ->download("{$invoice->invoice_number}.pdf");
    }
}
