<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditLogObserver
{
    public function created(Model $model): void
    {
        $this->log($model, 'created', [], $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $dirty = $model->getDirty();
        $original = collect($dirty)
            ->mapWithKeys(fn ($val, $key) => [$key => $model->getOriginal($key)])
            ->toArray();

        $this->log($model, 'updated', $original, $dirty);
    }

    public function deleted(Model $model): void
    {
        $this->log($model, 'deleted', $model->getAttributes(), []);
    }

    private function log(Model $model, string $event, array $old, array $new): void
    {
        $request = request();
        $user = $request->user();
        $companyId = $model->company_id ?? $user?->company_id;

        if (! $companyId) {
            return;
        }

        AuditLog::create([
            'company_id' => $companyId,
            'user_id' => $user?->id,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->getKey(),
            'event' => $event,
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
