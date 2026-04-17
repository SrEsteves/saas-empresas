<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    protected $fillable = [
        'tenant_id',
        'plan_id',
        'status',
        'current_period_start',
        'current_period_end',
        'trial_ends_at',
        'canceled_at',
        'cancellation_reason',
        'stripe_subscription_id',
        'stripe_customer_id',
        'payment_method_last4',
        'is_trial',
        'failed_payment_attempts',
        'last_payment_failed_at',
        'last_renewed_at',
        'ends_at',
    ];

    protected $casts = [
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'trial_ends_at' => 'datetime',
        'canceled_at' => 'datetime',
        'is_trial' => 'boolean',
        'last_payment_failed_at' => 'datetime',
        'last_renewed_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    protected $appends = [
        'is_scheduled_for_cancellation',
    ];

    // Relacionamentos
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    // Métodos utilitários
    public function isActive(): bool
    {
        return $this->status === 'active' && $this->current_period_end > now();
    }

    public function isOnTrial(): bool
    {
        return $this->is_trial && $this->trial_ends_at > now();
    }

    public function isCanceled(): bool
    {
        return $this->status === 'canceled';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->current_period_end && $this->current_period_end < now());
    }

    public function daysLeftOnTrial(): int
    {
        if (!$this->isOnTrial()) {
            return 0;
        }

        return now()->diffInDays($this->trial_ends_at, false);
    }

    public function canUseFeature(string $feature): bool
    {
        if (!$this->isActive() && !$this->isOnTrial()) {
            return false;
        }

        return $this->plan->hasFeature($feature);
    }

    public function getIsScheduledForCancellationAttribute(): bool
    {
        return $this->canceled_at !== null && $this->ends_at && $this->ends_at->isFuture();
    }

    // Scopes
    public function scopeActive()
    {
        return $this->where('status', 'active')
            ->where('current_period_end', '>', now());
    }

    public function scopeOnTrial()
    {
        return $this->where('is_trial', true)
            ->where('trial_ends_at', '>', now());
    }

    public function scopeExpired()
    {
        return $this->where('status', 'expired')
            ->orWhere('current_period_end', '<', now());
    }
}
