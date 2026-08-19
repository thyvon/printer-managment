<?php

namespace App\Http\Middleware;

use App\Models\Collector;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use function setTenantCompany;

class CollectorAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        $collector = $token ? Collector::where('token', $token)->first() : null;

        if (! $collector) {
            return response()->json(['message' => 'Invalid collector token.'], 401);
        }

        setTenantCompany($collector->company_id);

        $request->merge(['collector' => $collector]);
        $request->setUserResolver(fn () => $collector);

        $response = $next($request);

        setTenantCompany(null);

        return $response;
    }
}
