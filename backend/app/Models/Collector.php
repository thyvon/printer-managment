<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['site_id', 'name', 'token', 'version', 'last_seen_at', 'status'])]
#[Hidden(['token'])]
class Collector extends Model
{
    use HasFactory, SoftDeletes;

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function printers()
    {
        return $this->hasManyThrough(Printer::class, Site::class, 'id', 'site_id', 'site_id', 'id');
    }

    protected static function booted(): void
    {
        static::creating(function (Collector $collector) {
            if (empty($collector->token)) {
                $collector->token = self::makeToken();
            }
        });
    }

    public static function makeToken(): string
    {
        return hash('sha256', random_bytes(32));
    }
}
