<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'current_password' => ['sometimes', 'string'],
            'password' => ['sometimes', 'string', Password::defaults(), 'confirmed'],
        ]);

        if (isset($data['password'])) {
            if (! isset($data['current_password']) || ! Hash::check($data['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }

            $user->password = $data['password'];
        }

        if (isset($data['name']) || isset($data['email'])) {
            $user->fill(collect($data)->only('name', 'email')->toArray());
        }

        $user->save();

        return response()->json([
            'user' => $user->load('company'),
            'message' => 'Profile updated.',
        ]);
    }
}
