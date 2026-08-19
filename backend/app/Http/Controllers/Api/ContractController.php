<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContractRequest;
use App\Http\Requests\UpdateContractRequest;
use App\Http\Resources\ContractResource;
use App\Models\Contract;

class ContractController extends Controller
{
    public function index()
    {
        return ContractResource::collection(
            Contract::with('pricingTiers')->latest()->paginate(request()->integer('per_page', 15))
        );
    }

    public function store(StoreContractRequest $request)
    {
        $contract = Contract::create($request->safe()->except('pricing_tiers'));

        if ($request->has('pricing_tiers')) {
            $contract->pricingTiers()->createMany($request->pricing_tiers);
        }

        return new ContractResource($contract->load('pricingTiers'));
    }

    public function show(Contract $contract)
    {
        return new ContractResource($contract->load('pricingTiers'));
    }

    public function update(UpdateContractRequest $request, Contract $contract)
    {
        $contract->update($request->safe()->except('pricing_tiers'));

        if ($request->has('pricing_tiers')) {
            foreach ($request->pricing_tiers as $tier) {
                if (isset($tier['id'])) {
                    $contract->pricingTiers()->findOrFail($tier['id'])->update($tier);
                } else {
                    $contract->pricingTiers()->create($tier);
                }
            }
        }

        return new ContractResource($contract->load('pricingTiers'));
    }

    public function destroy(Contract $contract)
    {
        $contract->delete();

        return response()->json(null, 204);
    }
}
