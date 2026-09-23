<?php

namespace App\Policies;

class CustomerPolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'customers';
    }
}
