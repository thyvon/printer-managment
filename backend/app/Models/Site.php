<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['customer_id', 'name', 'address', 'city', 'phone'])]
class Site extends Model
{
    use HasFactory, SoftDeletes;

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function printers()
    {
        return $this->hasMany(Printer::class);
    }
}
