<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrinterRequest;
use App\Http\Requests\UpdatePrinterRequest;
use App\Http\Resources\PrinterResource;
use App\Models\Printer;

class PrinterController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Printer::class);

        return PrinterResource::collection(Printer::latest()->paginate(request()->integer('per_page', 15)));
    }

    public function store(StorePrinterRequest $request)
    {
        $this->authorize('create', Printer::class);

        $printer = Printer::create($request->validated());

        return new PrinterResource($printer);
    }

    public function show(Printer $printer)
    {
        $this->authorize('view', $printer);

        return new PrinterResource($printer);
    }

    public function update(UpdatePrinterRequest $request, Printer $printer)
    {
        $this->authorize('update', $printer);

        $printer->update($request->validated());

        return new PrinterResource($printer);
    }

    public function destroy(Printer $printer)
    {
        $this->authorize('delete', $printer);

        $printer->delete();

        return response()->json(null, 204);
    }
}
