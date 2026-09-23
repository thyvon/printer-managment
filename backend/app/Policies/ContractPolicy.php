<?php

namespace App\Policies;

class ContractPolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'contracts';
    }
}
