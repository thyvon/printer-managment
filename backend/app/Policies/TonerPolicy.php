<?php

namespace App\Policies;

class TonerPolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'toners';
    }
}
