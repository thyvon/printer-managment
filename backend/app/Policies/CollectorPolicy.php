<?php

namespace App\Policies;

class CollectorPolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'collectors';
    }
}
