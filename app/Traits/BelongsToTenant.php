<?php

namespace App\Traits;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant()
    {
        if (auth()->check()) {
            static::addGlobalScope('tenant_isolation', function (Builder $builder) {
                $builder->where('tenant_id', auth()->user()->tenant_id);
            });

            static::creating(function ($model) {
                $model->tenant_id = auth()->user()->tenant_id;
            });
        }
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}