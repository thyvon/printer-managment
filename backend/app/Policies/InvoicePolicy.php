<?php

namespace App\Policies;

class InvoicePolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'invoices';
    }
}
