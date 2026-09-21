<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Printer;
use App\Models\Site;
use App\Models\User;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $thisMonth = now()->startOfMonth();

        $companies = Company::withCount('users', 'printers', 'customers')->get();

        return response()->json([
            'summary' => [
                'total_tenants' => Company::count(),
                'active_tenants' => Company::where('status', 'active')->count(),
                'trial_tenants' => Company::where('status', 'trial')->count(),
                'total_users' => User::count(),
                'total_printers' => Printer::count(),
                'total_customers' => Customer::count(),
                'total_sites' => Site::count(),
            ],
            'plans' => [
                'starter' => Company::where('plan', 'starter')->count(),
                'growth' => Company::where('plan', 'growth')->count(),
                'enterprise' => Company::where('plan', 'enterprise')->count(),
            ],
            'mrr' => [
                'total' => round(Invoice::where('created_at', '>=', $thisMonth)->where('status', '!=', 'void')->sum('total'), 2),
                'count' => Invoice::where('created_at', '>=', $thisMonth)->where('status', '!=', 'void')->count(),
            ],
            'recent_tenants' => Company::latest()->limit(5)->get()->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'plan' => $c->plan,
                'status' => $c->status,
                'created_at' => $c->created_at,
            ]),
        ]);
    }

    public function index(): JsonResponse
    {
        $companies = Company::withCount('users', 'printers', 'customers')
            ->latest()
            ->paginate(request()->integer('per_page', 15));

        return response()->json($companies);
    }

    public function show(Company $company): JsonResponse
    {
        $company->loadCount('users', 'printers', 'customers', 'sites', 'contracts');

        $company->recent_invoices = $company->invoices()
            ->with('customer')
            ->latest()
            ->limit(5)
            ->get();

        $company->recent_users = $company->users()
            ->latest()
            ->limit(5)
            ->get();

        return response()->json($company);
    }

    public function updatePlan(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'plan' => ['required', 'in:starter,growth,enterprise'],
            'device_limit' => ['required', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:active,trial,suspended'],
        ]);

        $company->update($data);

        return response()->json([
            'message' => 'Plan updated.',
            'company' => $company,
        ]);
    }

    public function analytics(): JsonResponse
    {
        $months = collect();
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i)->startOfMonth();
            $months->push([
                'month' => $month->format('Y-m'),
                'tenants' => Company::where('created_at', '<=', $month->copy()->endOfMonth())->count(),
                'revenue' => round(Invoice::where('period_start', '>=', $month->startOfMonth())
                    ->where('period_start', '<=', $month->endOfMonth())
                    ->where('status', '!=', 'void')
                    ->sum('total'), 2),
            ]);
        }

        return response()->json([
            'monthly_trend' => $months,
            'by_plan' => [
                'starter' => Company::where('plan', 'starter')->count(),
                'growth' => Company::where('plan', 'growth')->count(),
                'enterprise' => Company::where('plan', 'enterprise')->count(),
            ],
            'by_status' => [
                'active' => Company::where('status', 'active')->count(),
                'trial' => Company::where('status', 'trial')->count(),
                'suspended' => Company::where('status', 'suspended')->count(),
            ],
        ]);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'is_platform_admin' => ['required', 'boolean'],
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'User updated.',
            'user' => $user,
        ]);
    }
}
