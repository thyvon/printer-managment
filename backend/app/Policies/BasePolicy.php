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
        if ($user->role === UserRole::Admin) {
            return true;
        }

        if ($user->role === UserRole::Manager) {
            return true;
        }

        return $user->hasPermission($this->getPermissionPrefix().'.create');
    }

    public function update(User $user, $model): bool
    {
        if ($user->role === UserRole::Admin) {
            return true;
        }

        if ($user->role === UserRole::Manager) {
            return true;
        }

        return $user->hasPermission($this->getPermissionPrefix().'.update');
    }

    public function delete(User $user, $model): bool
    {
        if ($user->role === UserRole::Admin) {
            return true;
        }

        return $user->hasPermission($this->getPermissionPrefix().'.delete');
    }

    public function forceDelete(User $user, $model): bool
    {
        return false;
    }

    abstract protected function getPermissionPrefix(): string;
}
