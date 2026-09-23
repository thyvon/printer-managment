<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'users';
    }

    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::Admin || $user->hasPermission('users.view');
    }

    public function view(User $user, User $model): bool
    {
        return $user->role === UserRole::Admin || $user->id === $model->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::Admin;
    }

    public function update(User $user, User $model): bool
    {
        return $user->role === UserRole::Admin || $user->id === $model->id;
    }

    public function delete(User $user, User $model): bool
    {
        return $user->role === UserRole::Admin && $user->id !== $model->id;
    }
}
