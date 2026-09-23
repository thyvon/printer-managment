<?php

namespace App\Policies;

class ServiceTicketPolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'service_tickets';
    }
}
