<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCollectorRequest;
use App\Http\Requests\UpdateCollectorRequest;
use App\Http\Resources\CollectorResource;
use App\Models\Collector;

class CollectorController extends Controller
{
    public function index()
    {
        return CollectorResource::collection(Collector::latest()->paginate());
    }

    public function store(StoreCollectorRequest $request)
    {
        $collector = Collector::create([
            ...$request->validated(),
            'token' => Collector::makeToken(),
        ]);

        return (new CollectorResource($collector))
            ->additional(['token' => $collector->token]);
    }

    public function show(Collector $collector)
    {
        return new CollectorResource($collector);
    }

    public function update(UpdateCollectorRequest $request, Collector $collector)
    {
        $collector->update($request->validated());

        return new CollectorResource($collector);
    }

    public function destroy(Collector $collector)
    {
        $collector->delete();

        return response()->json(null, 204);
    }
}
