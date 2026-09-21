<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Staff = 'staff';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Manager => 'Manager',
            self::Staff => 'Staff',
        };
    }

    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    public function isManagerOrAbove(): bool
    {
        return $this === self::Admin || $this === self::Manager;
    }
}
