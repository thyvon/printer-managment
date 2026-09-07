<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceTicketRequest;
use App\Http\Requests\UpdateServiceTicketRequest;
use App\Http\Resources\ServiceTicketResource;
use App\Models\ServiceTicket;

class ServiceTicketController extends Controller
{
    public function index()
    {
        $query = ServiceTicket::with(['customer', 'site', 'printer', 'assignedUser'])->latest();

        if (request()->has('customer_id')) {
            $query->where('customer_id', request()->integer('customer_id'));
        }
        if (request()->has('site_id')) {
            $query->where('site_id', request()->integer('site_id'));
        }
        if (request()->has('printer_id')) {
            $query->where('printer_id', request()->integer('printer_id'));
        }
        if (request()->has('status')) {
            $query->where('status', request()->string('status'));
        }
        if (request()->has('assigned_user_id')) {
            $query->where('assigned_user_id', request()->integer('assigned_user_id'));
        }

        return ServiceTicketResource::collection($query->paginate(request()->integer('per_page', 15)));
    }

    public function store(StoreServiceTicketRequest $request)
    {
        $data = $request->validated();
        $data['status'] = $data['status'] ?? 'open';
        $ticket = ServiceTicket::create($data);

        return new ServiceTicketResource($ticket->load(['customer', 'site', 'printer', 'assignedUser']));
    }

    public function show(ServiceTicket $serviceTicket)
    {
        return new ServiceTicketResource($serviceTicket->load(['customer', 'site', 'printer', 'assignedUser']));
    }

    public function update(UpdateServiceTicketRequest $request, ServiceTicket $serviceTicket)
    {
        $serviceTicket->update($request->validated());

        return new ServiceTicketResource($serviceTicket->load(['customer', 'site', 'printer', 'assignedUser']));
    }

    public function destroy(ServiceTicket $serviceTicket)
    {
        $serviceTicket->delete();

        return response()->json(null, 204);
    }
}
