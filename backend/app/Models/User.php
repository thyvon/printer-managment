<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use App\Models\Concerns\BelongsToCompany;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['company_id', 'name', 'email', 'password', 'role', 'is_platform_admin'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use BelongsToCompany, HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_platform_admin' => 'boolean',
        ];
    }

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'user_permissions');
    }

    public function hasPermission(string $name): bool
    {
        if ($this->role === UserRole::Admin) {
            return true;
        }

        return $this->permissions()->where('name', $name)->exists();
    }

    public function hasAnyPermission(array $names): bool
    {
        if ($this->role === UserRole::Admin) {
            return true;
        }

        return $this->permissions()->whereIn('name', $names)->exists();
    }

    public function givePermissionTo(string $name): void
    {
        $permission = Permission::where('name', $name)->firstOrFail();
        $this->permissions()->syncWithoutDetaching($permission->id);
    }

    public function revokePermissionTo(string $name): void
    {
        $permission = Permission::where('name', $name)->first();
        if ($permission) {
            $this->permissions()->detach($permission->id);
        }
    }
}
