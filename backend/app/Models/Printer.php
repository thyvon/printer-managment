<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['site_id', 'name', 'manufacturer', 'model', 'serial_number', 'ip_address', 'snmp_community', 'status'])]
class Printer extends Model
{
    use HasFactory, SoftDeletes;

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function customer()
    {
        return $this->hasOneThrough(Customer::class, Site::class, 'id', 'id', 'site_id', 'customer_id');
    }
}
