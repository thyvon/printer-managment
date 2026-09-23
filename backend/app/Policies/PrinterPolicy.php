<?php

namespace App\Policies;

class PrinterPolicy extends BasePolicy
{
    protected function getPermissionPrefix(): string
    {
        return 'printers';
    }
}
