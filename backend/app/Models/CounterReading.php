<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id', 'collector_id', 'printer_id', 'total_pages', 'mono_pages', 'color_pages', 'read_at'])]
class CounterReading extends Model
{
    use BelongsToCompany, HasFactory;

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function collector()
    {
        return $this->belongsTo(Collector::class);
    }

    public function printer()
    {
        return $this->belongsTo(Printer::class);
    }

    /**
     * Append-only audit trail: a counter reading can never be mutated
     * or removed once recorded. Overriding these methods is deliberate.
     */
    public static function booted(): void
    {
        static::deleting(function () {
            throw new \RuntimeException('Counter readings are append-only and cannot be deleted.');
        });

        static::updating(function () {
            throw new \RuntimeException('Counter readings are append-only and cannot be updated.');
        });
    }
}
