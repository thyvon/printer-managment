<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['printer_id', 'period_start', 'period_end', 'start_reading_id', 'end_reading_id', 'total_pages', 'mono_pages', 'color_pages'])]
class Usage extends Model
{
    use HasFactory;

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
