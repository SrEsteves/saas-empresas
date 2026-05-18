<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Notifications\Notifiable;

class Tenant extends Model
{
    use Notifiable;

    // Liberamos as novas colunas para serem salvas no banco
    protected $fillable = [
        'name', 
        'is_active',
        'status',
        'current_plan_id',
        'working_hours',
        'closed_dates',
        'bot_message',
        'confirmation_message',
        'cancellation_message',
        'appointment_interval_minutes',
        'logo_path',
        'address',
        'phone',
        'public_url_slug',
        'appointments_this_month',
        'last_usage_reset_at',
    ];

    protected $casts = [
        'working_hours' => 'array',
        'closed_dates' => 'array',
        'appointment_interval_minutes' => 'integer',
        'last_usage_reset_at' => 'datetime',
    ];

    // ============== RELACIONAMENTOS ==============
    
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    // BILLING
    public function currentPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'current_plan_id');
    }

    public function subscription(): HasMany
    {
        // Geralmente há apenas uma subscrição ativa por tenant
        // Use ->first() ou ->active()->first() para pegar a ativa
        return $this->hasMany(Subscription::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    // ============== MÉTODOS UTILITÁRIOS ==============

    public function getActiveSubscription(): ?Subscription
    {
        // Primeiro tenta encontrar uma subscription ativa paga
        $activeSubscription = $this->subscription()
            ->where('status', 'active')
            ->where('current_period_end', '>', now())
            ->first();

        if ($activeSubscription) {
            return $activeSubscription;
        }

        $canceledSubscriptionInPaidPeriod = $this->subscription()
            ->where('status', 'canceled')
            ->where('ends_at', '>', now())
            ->first();

        if ($canceledSubscriptionInPaidPeriod) {
            return $canceledSubscriptionInPaidPeriod;
        }

        // Se não encontrou, tenta encontrar uma subscription em trial ativa
        return $this->subscription()
            ->where('status', 'trial')
            ->where('trial_ends_at', '>', now())
            ->first();
    }

    public function hasActiveSubscription(): bool
    {
        return $this->getActiveSubscription() !== null;
    }

    public function isOnTrial(): bool
    {
        $subscription = $this->getActiveSubscription();
        return $subscription && $subscription->isOnTrial();
    }

    public function canUseFeature(string $feature): bool
    {
        $subscription = $this->getActiveSubscription();
        
        if (!$subscription) {
            return false;
        }

        return $subscription->canUseFeature($feature);
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function isOnHold(): bool
    {
        return $this->status === 'on_hold';
    }

    public function getPlanLimits(): array
    {
        $plan = $this->currentPlan;

        if (!$plan) {
            return [];
        }

        return [
            'max_appointments_per_month' => $plan->max_appointments_per_month,
            'max_employees' => $plan->max_employees,
            'max_services' => $plan->max_services,
            'max_products' => $plan->max_products,
            'max_categories' => $plan->max_categories,
        ];
    }
}