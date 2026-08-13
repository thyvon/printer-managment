<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Usage;
use Carbon\Carbon;

class InvoicingService
{
    /**
     * Generate an invoice for a customer for a given month by applying their
     * active contract's pricing tier to the calculated usage.
     *
     * Billing model: monthly fee + overage pages beyond the included volume.
     * Overage = max(0, usage - included) per page type (mono/color) × rate.
     */
    public function generate(Customer $customer, Carbon $month, ?Contract $contract = null): Invoice
    {
        $contract = $contract ?: $customer->contracts()->where('status', 'active')->first();

        if (! $contract) {
            throw new \RuntimeException("Customer {$customer->id} has no active contract.");
        }

        $tier = $contract->pricingTiers()->first();

        if (! $tier) {
            throw new \RuntimeException("Contract {$contract->id} has no pricing tier.");
        }

        $periodStart = $month->copy()->startOfMonth();
        $periodEnd = $month->copy()->endOfMonth();

        $printerIds = $customer->sites()->with('printers')->get()
            ->flatMap(fn ($site) => $site->printers->pluck('id'));

        $usage = Usage::whereIn('printer_id', $printerIds)
            ->where('period_start', $periodStart->startOfDay())
            ->where('period_end', $periodEnd->endOfDay())
            ->get();

        $totalMono = $usage->sum('mono_pages');
        $totalColor = $usage->sum('color_pages');

        $monoOverage = max(0, $totalMono - $tier->included_mono_pages);
        $colorOverage = max(0, $totalColor - $tier->included_color_pages);

        $monoAmount = $monoOverage * $tier->mono_rate;
        $colorAmount = $colorOverage * $tier->color_rate;
        $monthlyFee = $contract->monthly_fee;

        $subtotal = round($monthlyFee + $monoAmount + $colorAmount, 2);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'contract_id' => $contract->id,
            'invoice_number' => $this->nextNumber($customer),
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'currency' => $tier->currency,
            'subtotal' => $subtotal,
            'tax' => 0,
            'total' => $subtotal,
            'status' => 'draft',
        ]);

        $invoice->lines()->create([
            'description' => 'Monthly service fee',
            'kind' => 'monthly_fee',
            'currency' => $tier->currency,
            'quantity' => 1,
            'unit_price' => $monthlyFee,
            'amount' => $monthlyFee,
        ]);

        if ($monoOverage > 0) {
            $invoice->lines()->create([
                'description' => "Mono overage ({$monoOverage} pages)",
                'kind' => 'mono_overage',
                'currency' => $tier->currency,
                'quantity' => $monoOverage,
                'unit_price' => $tier->mono_rate,
                'amount' => round($monoAmount, 2),
            ]);
        }

        if ($colorOverage > 0) {
            $invoice->lines()->create([
                'description' => "Color overage ({$colorOverage} pages)",
                'kind' => 'color_overage',
                'currency' => $tier->currency,
                'quantity' => $colorOverage,
                'unit_price' => $tier->color_rate,
                'amount' => round($colorAmount, 2),
            ]);
        }

        return $invoice->load('lines', 'customer');
    }

    private function nextNumber(Customer $customer): string
    {
        $seq = Invoice::where('customer_id', $customer->id)->count() + 1;

        return sprintf('INV-%s-%04d', $customer->id, $seq);
    }
}
