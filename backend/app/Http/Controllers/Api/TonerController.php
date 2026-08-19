<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTonerRequest;
use App\Http\Requests\UpdateTonerRequest;
use App\Http\Resources\TonerResource;
use App\Models\Toner;

class TonerController extends Controller
{
    public function index()
    {
        $query = Toner::latest();

        if (request()->has('low_stock')) {
            $query->whereRaw('current_stock <= low_stock_threshold');
        }
        if (request()->has('color')) {
            $query->where('color', request()->string('color'));
        }

        return TonerResource::collection($query->paginate(request()->integer('per_page', 15)));
    }

    public function store(StoreTonerRequest $request)
    {
        $toner = Toner::create($request->validated());
        return new TonerResource($toner);
    }

    public function show(Toner $toner)
    {
        return new TonerResource($toner);
    }

    public function update(UpdateTonerRequest $request, Toner $toner)
    {
        $toner->update($request->validated());
        return new TonerResource($toner);
    }

    public function destroy(Toner $toner)
    {
        $toner->delete();
        return response()->json(null, 204);
    }
}