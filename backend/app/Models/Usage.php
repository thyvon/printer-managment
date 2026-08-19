<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['company_id', 'printer_id', 'period_start', 'period_end', 'start_reading_id', 'end_reading_id', 'total_pages', 'mono_pages', 'color_pages'])]
class Usage extends Model
{
    use BelongsToCompany, HasFactory;

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
        ];
    }

    public function printer()
    {
        return $this->belongsTo(Printer::class);
    }

    public function startReading()
    {
        return $this->belongsTo(CounterReading::class, 'start_reading_id');
    }

    public function endReading()
    {
        return $this->belongsTo(CounterReading::class, 'end_reading_id');
    }
}
