<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function index()
    {
        return UserResource::collection(
            User::with('permissions')->latest()->paginate(request()->integer('per_page', 15))
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => $request->role,
            'company_id' => $request->user()->company_id,
        ]);

        return response()->json(new UserResource($user->load('permissions')), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(new UserResource($user->load('permissions')));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->only(['name', 'email', 'role']);

        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        $user->update($data);

        return response()->json(new UserResource($user->load('permissions')));
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === $request()->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 422);
        }

        $user->delete();

        return response()->json(null, 204);
    }

    public function permissions(): JsonResponse
    {
        $permissions = Permission::all()->groupBy('group');

        return response()->json($permissions);
    }

    public function updatePermissions(User $user): JsonResponse
    {
        $data = request()->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $user->permissions()->sync(
            Permission::whereIn('name', $data['permissions'])->pluck('id')
        );

        return response()->json(new UserResource($user->load('permissions')));
    }
}
