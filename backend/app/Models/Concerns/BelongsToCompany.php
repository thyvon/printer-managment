<?php

namespace App\Models\Concerns;

use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Global query scoping to a tenant company.
 *
 * Every business model using this trait is automatically filtered to the
 * current tenant, and any model created through the request pipeline is
 * stamped with the current tenant. The tenant is resolved from (in order):
 * an explicit context set by a collector/console job, or the authenticated
 * user's company. There is no code path where one tenant can read or write
 * another tenant's data by accident.
 */
trait BelongsToCompany
{
    public static function bootBelongsToCompany(): void
    {
        static::addGlobalScope('company', function (Builder $builder) {
            if ($companyId = tenantCompanyId()) {
                $builder->where($builder->getModel()->getTable().'.company_id', $companyId);
            }
        });

        static::creating(function (Model $model) {
            if (empty($model->company_id) && $companyId = tenantCompanyId()) {
                $model->company_id = $companyId;
            }
        });
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
