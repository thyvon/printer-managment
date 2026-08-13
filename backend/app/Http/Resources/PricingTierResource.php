<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PricingTierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'name' => $this->name,
            'currency' => $this->currency,
            'included_mono_pages' => $this->included_mono_pages,
            'included_color_pages' => $this->included_color_pages,
            'mono_rate' => $this->mono_rate,
            'color_rate' => $this->color_rate,
        ];
    }
}
