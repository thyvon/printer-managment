<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ManagerOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! in_array($request->user()->role, [UserRole::Admin, UserRole::Manager])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
