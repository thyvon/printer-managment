<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_id' => $this->customer_id,
            'contract_id' => $this->contract_id,
            'invoice_number' => $this->invoice_number,
            'period_start' => $this->period_start,
            'period_end' => $this->period_end,
            'currency' => $this->currency,
            'subtotal' => $this->subtotal,
            'tax' => $this->tax,
            'total' => $this->total,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'lines' => InvoiceLineResource::collection($this->whenLoaded('lines')),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
        ];
    }
}
