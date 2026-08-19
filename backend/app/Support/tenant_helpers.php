<?php

if (! class_exists('TenantContext')) {
    class TenantContext
    {
        public static ?int $companyId = null;
    }
}

if (! function_exists('tenantCompanyId')) {
    function tenantCompanyId(): ?int
    {
        if (TenantContext::$companyId) {
            return TenantContext::$companyId;
        }

        return auth()->user()?->company_id;
    }
}

if (! function_exists('setTenantCompany')) {
    function setTenantCompany(?int $companyId): void
    {
        TenantContext::$companyId = $companyId;
    }
}
