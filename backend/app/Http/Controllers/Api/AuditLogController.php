<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    public function index()
    {
        $query = AuditLog::with('user')->latest();

        if (request()->has('event')) {
            $query->where('event', request()->string('event'));
        }
        if (request()->has('auditable_type')) {
            $query->where('auditable_type', 'App\\Models\\'.request()->string('auditable_type'));
        }
        if (request()->has('user_id')) {
            $query->where('user_id', request()->integer('user_id'));
        }

        return AuditLogResource::collection($query->paginate(request()->integer('per_page', 15)));
    }
}
