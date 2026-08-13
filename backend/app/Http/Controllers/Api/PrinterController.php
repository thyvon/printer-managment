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
        return PrinterResource::collection(Printer::latest()->paginate());
    }

    public function store(StorePrinterRequest $request)
    {
        $printer = Printer::create($request->validated());

        return new PrinterResource($printer);
    }

    public function show(Printer $printer)
    {
        return new PrinterResource($printer);
    }

    public function update(UpdatePrinterRequest $request, Printer $printer)
    {
        $printer->update($request->validated());

        return new PrinterResource($printer);
    }

    public function destroy(Printer $printer)
    {
        $printer->delete();

        return response()->json(null, 204);
    }
}
