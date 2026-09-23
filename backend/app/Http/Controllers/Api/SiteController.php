<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSiteRequest;
use App\Http\Requests\UpdateSiteRequest;
use App\Http\Resources\SiteResource;
use App\Models\Site;

class SiteController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Site::class);

        $query = Site::latest();

        if (request()->has('customer_id')) {
            $query->where('customer_id', request()->integer('customer_id'));
        }

        return SiteResource::collection($query->paginate(request()->integer('per_page', 15)));
    }

    public function store(StoreSiteRequest $request)
    {
        $this->authorize('create', Site::class);

        $site = Site::create($request->validated());

        return new SiteResource($site);
    }

    public function show(Site $site)
    {
        $this->authorize('view', $site);

        return new SiteResource($site);
    }

    public function update(UpdateSiteRequest $request, Site $site)
    {
        $this->authorize('update', $site);

        $site->update($request->validated());

        return new SiteResource($site);
    }

    public function destroy(Site $site)
    {
        $this->authorize('delete', $site);

        $site->delete();

        return response()->json(null, 204);
    }
}
