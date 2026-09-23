<?php

namespace App\Policies;

class SitePolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'sites';
    }
}
