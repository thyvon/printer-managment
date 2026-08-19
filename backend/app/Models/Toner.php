<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['company_id', 'name', 'part_number', 'color', 'printer_models', 'current_stock', 'low_stock_threshold', 'unit', 'unit_cost', 'supplier', 'supplier_part_number', 'notes'])]
class Toner extends Model
{
    use BelongsToCompany, HasFactory, SoftDeletes;

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->low_stock_threshold;
    }

    public function getCompatibleModelsAttribute(): array
    {
        if (empty($this->printer_models)) {
            return [];
        }
        return array_map('trim', explode(',', $this->printer_models));
    }
}