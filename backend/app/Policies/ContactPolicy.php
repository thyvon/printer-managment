<?php

namespace App\Policies;

class ContactPolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'contacts';
    }
}
