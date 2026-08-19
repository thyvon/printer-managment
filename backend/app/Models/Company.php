<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'plan', 'status', 'device_limit', 'email', 'phone'])]
class Company extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (Company $company) {
            if (empty($company->slug)) {
                $company->slug = Str::slug($company->name).'-'.Str::lower(Str::random(6));
            }
        });
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function sites()
    {
        return $this->hasMany(Site::class);
    }

    public function printers()
    {
        return $this->hasMany(Printer::class);
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }
}
