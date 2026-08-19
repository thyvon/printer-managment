<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id', 'contract_id', 'name', 'currency', 'included_mono_pages', 'included_color_pages', 'mono_rate', 'color_rate'])]
class PricingTier extends Model
{
    use BelongsToCompany, HasFactory;

    protected function casts(): array
    {
        return [
            'included_mono_pages' => 'integer',
            'included_color_pages' => 'integer',
            'mono_rate' => 'decimal:4',
            'color_rate' => 'decimal:4',
        ];
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
