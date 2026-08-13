<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['customer_id', 'name', 'status', 'monthly_fee', 'start_date', 'end_date'])]
class Contract extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'monthly_fee' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function pricingTiers()
    {
        return $this->hasMany(PricingTier::class);
    }
}
