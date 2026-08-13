<?php

namespace App\Http\Middleware;

use App\Models\Collector;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CollectorAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        $collector = $token ? Collector::where('token', $token)->first() : null;

        if (! $collector) {
            return response()->json(['message' => 'Invalid collector token.'], 401);
        }

        $request->merge(['collector' => $collector]);
        $request->setUserResolver(fn () => $collector);

        return $next($request);
    }
}
