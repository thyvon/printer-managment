<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TonerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'part_number' => $this->part_number,
            'color' => $this->color,
            'printer_models' => $this->printer_models,
            'current_stock' => $this->current_stock,
            'low_stock_threshold' => $this->low_stock_threshold,
            'unit' => $this->unit,
            'unit_cost' => $this->unit_cost,
            'supplier' => $this->supplier,
            'supplier_part_number' => $this->supplier_part_number,
            'notes' => $this->notes,
            'is_low_stock' => $this->isLowStock(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
