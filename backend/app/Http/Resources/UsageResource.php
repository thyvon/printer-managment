<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'printer_id' => $this->printer_id,
            'period_start' => $this->period_start,
            'period_end' => $this->period_end,
            'total_pages' => $this->total_pages,
            'mono_pages' => $this->mono_pages,
            'color_pages' => $this->color_pages,
            'printer' => new PrinterResource($this->whenLoaded('printer')),
        ];
    }
}
