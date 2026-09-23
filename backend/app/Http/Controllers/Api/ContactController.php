<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Http\Requests\UpdateContactRequest;
use App\Http\Resources\ContactResource;
use App\Models\Contact;

class ContactController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Contact::class);

        $query = Contact::latest();

        if (request()->has('customer_id')) {
            $query->where('customer_id', request()->integer('customer_id'));
        }

        return ContactResource::collection($query->paginate(request()->integer('per_page', 15)));
    }

    public function store(StoreContactRequest $request)
    {
        $this->authorize('create', Contact::class);

        $contact = Contact::create($request->validated());

        return new ContactResource($contact);
    }

    public function show(Contact $contact)
    {
        $this->authorize('view', $contact);

        return new ContactResource($contact);
    }

    public function update(UpdateContactRequest $request, Contact $contact)
    {
        $this->authorize('update', $contact);

        $contact->update($request->validated());

        return new ContactResource($contact);
    }

    public function destroy(Contact $contact)
    {
        $this->authorize('delete', $contact);

        $contact->delete();

        return response()->json(null, 204);
    }
}
