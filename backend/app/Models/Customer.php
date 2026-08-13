<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'email', 'phone', 'address', 'currency', 'status'])]
class Customer extends Model
{
    use HasFactory, SoftDeletes;

    public function sites()
    {
        return $this->hasMany(Site::class);
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }
}
