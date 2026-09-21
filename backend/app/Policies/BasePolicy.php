<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

abstract class BasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, $model): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->role !== UserRole::Staff;
    }

    public function update(User $user, $model): bool
    {
        return true;
    }

    public function delete(User $user, $model): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function forceDelete(User $user, $model): bool
    {
        return false;
    }
}
