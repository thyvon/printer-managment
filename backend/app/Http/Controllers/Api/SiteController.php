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
        return SiteResource::collection(Site::latest()->paginate());
    }

    public function store(StoreSiteRequest $request)
    {
        $site = Site::create($request->validated());

        return new SiteResource($site);
    }

    public function show(Site $site)
    {
        return new SiteResource($site);
    }

    public function update(UpdateSiteRequest $request, Site $site)
    {
        $site->update($request->validated());

        return new SiteResource($site);
    }

    public function destroy(Site $site)
    {
        $site->delete();

        return response()->json(null, 204);
    }
}
