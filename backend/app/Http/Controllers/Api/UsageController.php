<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UsageResource;
use App\Models\Usage;
use Carbon\Carbon;
use Illuminate\Http\Request;

class UsageController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->query('month');

        $query = Usage::with('printer');

        if ($month) {
            $query->whereBetween('period_start', [Carbon::parse($month.'-01')->startOfMonth(), Carbon::parse($month.'-01')->endOfMonth()]);
        }

        return UsageResource::collection($query->latest('period_start')->paginate());
    }
}
