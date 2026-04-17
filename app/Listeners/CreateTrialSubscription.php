<?php

namespace App\Listeners;

use App\Models\Plan;
use App\Services\StripeService;
use Illuminate\Auth\Events\Registered;

/**
 * Listener que executa quando um novo usuário se registra
 * Automaticamente cria uma subscrição em trial
 */
class CreateTrialSubscription
{
    public function __construct(private StripeService $stripeService)
    {
    }

    public function handle(Registered $event): void
    {
        $user = $event->user;
        $tenant = $user->tenant;

        // Se já tem subscrição, não faz nada
        if ($tenant->subscription()->exists()) {
            return;
        }

        // Pega plano gratuito como plano padrão
        $freePlan = Plan::where('slug', 'free')->first();

        if ($freePlan) {
            // Cria subscrição em trial
            $this->stripeService->startTrial($tenant, $freePlan);
        }
    }
}
