<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CollectorAgentController;
use App\Http\Controllers\Api\CollectorController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PrinterController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceTicketController;
use App\Http\Controllers\Api\SiteController;
use App\Http\Controllers\Api\TonerController;
use App\Http\Controllers\Api\UsageController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/dashboard', [DashboardController::class, 'summary']);

    Route::prefix('reports')->group(function () {
        Route::get('/usage', [ReportController::class, 'usage']);
        Route::get('/revenue', [ReportController::class, 'revenue']);
        Route::get('/fleet', [ReportController::class, 'fleet']);
    });

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::patch('/user', [ProfileController::class, 'update']);

    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('sites', SiteController::class);
    Route::apiResource('contacts', ContactController::class);
    Route::apiResource('printers', PrinterController::class);
    Route::apiResource('contracts', ContractController::class);
    Route::apiResource('collectors', CollectorController::class);
    Route::apiResource('users', UserController::class)->except(['create', 'edit'])->middleware('admin');
    Route::apiResource('service-tickets', ServiceTicketController::class);
    Route::apiResource('toners', TonerController::class);
    Route::get('usages', [UsageController::class, 'index']);
    Route::post('invoices/generate', [InvoiceController::class, 'generate']);
    Route::get('invoices', [InvoiceController::class, 'index']);
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
});

Route::prefix('collector')->middleware('collector.auth')->group(function () {
    Route::post('/heartbeat', [CollectorAgentController::class, 'heartbeat']);
    Route::post('/readings', [CollectorAgentController::class, 'readings']);
});
