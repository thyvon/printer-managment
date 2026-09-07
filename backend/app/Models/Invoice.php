<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use App\Notifications\InvoiceGeneratedNotification;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id', 'customer_id', 'contract_id', 'invoice_number', 'period_start', 'period_end', 'currency', 'subtotal', 'tax', 'total', 'status'])]
class Invoice extends Model
{
    use BelongsToCompany, HasFactory;

    protected static function booted(): void
    {
        static::created(function (Invoice $invoice) {
            $invoice->notifyAdmins();
        });
    }

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function lines()
    {
        return $this->hasMany(InvoiceLine::class);
    }

    public function notifyAdmins(): void
    {
        $admins = User::where('company_id', $this->company_id)
            ->where('role', 'admin')
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new InvoiceGeneratedNotification($this));
        }
    }
}
