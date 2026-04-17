<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'yearly_price',
        'max_appointments_per_month',
        'max_employees',
        'max_services',
        'max_products',
        'max_categories',
        'features',
        'trial_days',
        'is_active',
        'stripe_monthly_price_id',
        'stripe_yearly_price_id',
    ];

    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
    ];

    protected $attributes = [
        'features' => '[]',
    ];

    // Relacionamentos
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'current_plan_id');
    }

    // Métodos utilitários
    public function hasFeature(string $feature): bool
    {
        return in_array($feature, $this->features ?? []);
    }

    public function isLimitedByFeature(string $feature): bool
    {
        return !$this->hasFeature($feature);
    }

    // Scopes
    public function scopeActive()
    {
        return $this->where('is_active', true);
    }

    public function scopeFree()
    {
        return $this->where('monthly_price', 0);
    }
}
