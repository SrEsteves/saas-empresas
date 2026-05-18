<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use Stripe\Customer;
use Stripe\Invoice as StripeInvoice;
use Stripe\StripeClient;

class StripeService
{
    protected StripeClient $stripe;

    public function __construct()
    {
        $secretKey = config('services.stripe.secret');

        if (empty($secretKey)) {
            throw new \InvalidArgumentException(
                'Stripe secret key não configurada. Adicione STRIPE_SECRET_KEY no .env'
            );
        }

        $this->stripe = new StripeClient($secretKey);
    }

    /**
     * Criar session de checkout — método principal chamado pelo BillingController
     */
    public function createCheckoutSession(Tenant $tenant, Plan $plan, bool $isYearly = false): string
    {
        $priceId = $isYearly ? $plan->stripe_yearly_price_id : $plan->stripe_monthly_price_id;

        if (empty($priceId)) {
            throw new \InvalidArgumentException(
                "Price ID do Stripe não configurado para o plano '{$plan->name}'. "
                . "Verifique STRIPE_" . strtoupper($plan->slug) . "_" . ($isYearly ? "YEARLY" : "MONTHLY") . "_PRICE_ID no .env"
            );
        }

        $customer = $this->createOrUpdateCustomer($tenant);

        $session = $this->stripe->checkout->sessions->create([
            'payment_method_types' => ['card'],
            'mode'                 => 'subscription',
            'customer'             => $customer->id,
            'line_items'           => [
                [
                    'price'    => $priceId,
                    'quantity' => 1,
                ],
            ],
            'success_url' => route('billing.success', absolute: true) . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url'  => route('billing.canceled', absolute: true),
            'metadata'    => [
                'tenant_id' => $tenant->id,
                'plan_id'   => $plan->id,
            ],
        ]);

        return $session->url;
    }

    /**
     * Iniciar trial para novo tenant
     */
    public function startTrial(Tenant $tenant, Plan $plan = null): Subscription
    {
        $plan = $plan ?? Plan::where('slug', 'free')->firstOrFail();

        $trialEndsAt = now()->addDays($plan->trial_days ?? 14);

        $subscription = Subscription::create([
            'tenant_id'     => $tenant->id,
            'plan_id'       => $plan->id,
            'status'        => 'trial',
            'is_trial'      => true,
            'trial_ends_at' => $trialEndsAt,
        ]);

        $tenant->update(['current_plan_id' => $plan->id]);

        return $subscription;
    }

    /**
     * Atualizar para outro plano (já tem subscription no Stripe)
     */
    public function upgradePlan(Subscription $subscription, Plan $newPlan, bool $isYearly = false): Subscription
    {
        if (!$subscription->stripe_subscription_id) {
            throw new \RuntimeException('Esta subscription não tem ID do Stripe. Use o checkout para assinar.');
        }

        $priceId = $isYearly ? $newPlan->stripe_yearly_price_id : $newPlan->stripe_monthly_price_id;

        if (empty($priceId)) {
            throw new \InvalidArgumentException("Price ID não configurado para o plano '{$newPlan->name}'.");
        }

        $stripeSubscription = $this->stripe->subscriptions->retrieve($subscription->stripe_subscription_id);

        $this->stripe->subscriptions->update(
            $subscription->stripe_subscription_id,
            [
                'items' => [
                    [
                        'id'    => $stripeSubscription->items->data[0]->id,
                        'price' => $priceId,
                    ],
                ],
                'proration_behavior' => 'create_prorations',
            ]
        );

        $subscription->update(['plan_id' => $newPlan->id]);
        $subscription->tenant->update(['current_plan_id' => $newPlan->id]);

        return $subscription->fresh();
    }

    /**
     * Cancelar subscrição
     */
    public function cancelSubscription(Subscription $subscription, string $reason = null): void
    {
        if ($subscription->stripe_subscription_id) {
            // CORREÇÃO: Agenda o cancelamento para o fim do período de faturamento
            $stripeSubscription = $this->stripe->subscriptions->update($subscription->stripe_subscription_id, [
                'cancel_at_period_end' => true,
            ]);

            // Atualiza o registro local para refletir o cancelamento agendado
            $subscription->update([
                'status'              => 'canceled', // A assinatura vai para cancelada
                'cancellation_reason' => $reason,
                'canceled_at'         => now(), // Registra QUANDO o cancelamento foi solicitado
                'ends_at'             => $stripeSubscription->cancel_at ? now()->setTimestamp($stripeSubscription->cancel_at) : null,
            ]);

            // O tenant NÃO é suspenso agora. Ele só será suspenso quando o webhook
            // 'customer.subscription.deleted' for recebido no final do período.
        } else {
            // Para assinaturas sem ID do Stripe (ex: trial manual), cancela imediatamente.
            $subscription->update([
                'status'              => 'canceled',
                'canceled_at'         => now(),
                'cancellation_reason' => $reason,
            ]);
            $subscription->tenant->update(['status' => 'suspended']);
        }
    }

    /**
     * Processar webhook: fatura paga
     */
    public function handleInvoicePaid(string $stripeInvoiceId, Subscription $subscription = null): void
    {
        $stripeInvoice = $this->stripe->invoices->retrieve($stripeInvoiceId, [
            'expand' => ['subscription'],
        ]);
        
        // Se a subscription não foi passada (ex: renovação), busca no banco.
        // Se foi passada (ex: checkout inicial), usa ela diretamente.
        $subscription = $subscription ?? Subscription::where('stripe_subscription_id', $stripeInvoice->subscription?->id ?? $stripeInvoice->subscription)->first();

        Log::info('handleInvoicePaid: Stripe Invoice retrieved', [
            'stripe_invoice_id' => $stripeInvoiceId,
            'stripe_subscription_id_from_invoice' => $stripeInvoice->subscription?->id ?? $stripeInvoice->subscription,
            'customer_id_from_invoice' => $stripeInvoice->customer,
        ]);

        $subscription = Subscription::where('stripe_subscription_id', $stripeInvoice->subscription?->id ?? $stripeInvoice->subscription)
            ->first();

        if (!$subscription) {
            Log::warning('handleInvoicePaid: subscription não encontrada', [
                'stripe_invoice_id'       => $stripeInvoiceId,
                'stripe_subscription_id'  => $stripeInvoice->subscription,
            ]);
            return;
        }

        // Gerar descrição melhor - usar nome do plano se disponível
        $month = now()->createFromTimestamp($stripeInvoice->created)->format('M/Y');
        $planName = 'Assinatura';
        if ($subscription->plan_id && $subscription->plan) {
            $planName = $subscription->plan->name;
        }
        $description = "Assinatura {$planName} - {$month}";
        Log::info('handleInvoicePaid: Subscription found, preparing to create/update invoice', [
            'subscription_id' => $subscription->id,
            'description' => $description,
        ]);

        Invoice::updateOrCreate(
            ['stripe_invoice_id' => $stripeInvoiceId],
            [
                'tenant_id'       => $subscription->tenant_id,
                'subscription_id' => $subscription->id,
                'amount'          => $stripeInvoice->amount_paid,
                'currency'        => strtoupper($stripeInvoice->currency),
                'status'          => 'paid',
                'paid_at'         => now(),
                'issue_date'      => now()->toDateString(),
                'due_date'        => now()->toDateString(),
                'paid_at'         => $stripeInvoice->status_transitions->paid_at ? now()->createFromTimestamp($stripeInvoice->status_transitions->paid_at) : now(),
                'issue_date'      => now()->createFromTimestamp($stripeInvoice->created)->toDateString(),
                'due_date'        => $stripeInvoice->due_date ? now()->createFromTimestamp($stripeInvoice->due_date)->toDateString() : now()->createFromTimestamp($stripeInvoice->created)->toDateString(),
                'description'     => $description,
                'pdf_url'         => $stripeInvoice->invoice_pdf,
                'invoice_number'  => $stripeInvoice->number,
            ]
        );
        Log::info('handleInvoicePaid: Invoice updateOrCreate completed', [
            'stripe_invoice_id' => $stripeInvoiceId,
            'tenant_id' => $subscription->tenant_id,
        ]);

        // Atualiza período da subscription com dados frescos do Stripe
        if ($stripeInvoice->subscription && is_object($stripeInvoice->subscription)) {
            $subscription->update([
                'status'                 => 'active',
                'current_period_start'   => $stripeInvoice->subscription->current_period_start,
                'current_period_end'     => $stripeInvoice->subscription->current_period_end,
                'failed_payment_attempts'=> 0,
                'last_payment_failed_at' => null,
                'last_renewed_at'        => now(),
            ]);
        }
        Log::info('handleInvoicePaid: Subscription period updated', [
            'subscription_id' => $subscription->id,
            'status' => $subscription->status,
        ]);

        $subscription->tenant->update(['status' => 'active']);
        Log::info('handleInvoicePaid: Tenant status updated to active', [
            'tenant_id' => $subscription->tenant->id,
        ]);
    }

    /**
     * Sincronizar faturas de uma subscription do Stripe
     */
    public function syncInvoicesForSubscription(Subscription $subscription): void
    {
        if (!$subscription->stripe_subscription_id) {
            return; // Não há subscription no Stripe
        }

        // Buscar todas as faturas pagas desta subscription
        $stripeInvoices = $this->stripe->invoices->all([
            'subscription' => $subscription->stripe_subscription_id,
            'status' => 'paid',
        ]);

        foreach ($stripeInvoices->data as $stripeInvoice) {
            // Gerar descrição melhor
            $description = $stripeInvoice->description;
            if (!$description) {
                $month = now()->createFromTimestamp($stripeInvoice->created)->format('M/Y');
                $planName = 'Assinatura';
                if ($subscription->plan_id && $subscription->plan) {
                    $planName = $subscription->plan->name;
                }
                $description = "Assinatura {$planName} - {$month}";
            }

            Invoice::updateOrCreate(
                ['stripe_invoice_id' => $stripeInvoice->id],
                [
                    'tenant_id'       => $subscription->tenant_id,
                    'subscription_id' => $subscription->id,
                    'amount'          => $stripeInvoice->amount_paid,
                    'currency'        => strtoupper($stripeInvoice->currency),
                    'status'          => 'paid',
                    'paid_at'         => $stripeInvoice->status_transitions->paid_at ? 
                                       now()->createFromTimestamp($stripeInvoice->status_transitions->paid_at) : null,
                    'issue_date'      => $stripeInvoice->created ? 
                                       now()->createFromTimestamp($stripeInvoice->created)->toDateString() : now()->toDateString(),
                    'due_date'        => $stripeInvoice->due_date ? 
                                       now()->createFromTimestamp($stripeInvoice->due_date)->toDateString() : now()->toDateString(),
                    'description'     => $description,
                    'discount_amount' => 0,
                    'invoice_number'  => $stripeInvoice->number ?? "INV-{$stripeInvoice->id}",
                ]
            );
        }
    }

    /**
     * Sincronizar faturas para todas as subscriptions ativas
     */
    public function syncAllInvoices(): void
    {
        $subscriptions = Subscription::whereNotNull('stripe_subscription_id')->get();

        foreach ($subscriptions as $subscription) {
            $this->syncInvoicesForSubscription($subscription);
        }
    }
    public function handleInvoicePaymentFailed(string $stripeInvoiceId): void
    {
        $stripeInvoice = $this->stripe->invoices->retrieve($stripeInvoiceId);

        $subscription = Subscription::where(
            'stripe_subscription_id',
            $stripeInvoice->subscription
        )->first();

        if (!$subscription) return;

        $subscription->increment('failed_payment_attempts');
        $subscription->update(['last_payment_failed_at' => now()]);

        if ($subscription->failed_payment_attempts >= 3) {
            $this->cancelSubscription($subscription, 'Cancelamento automático após 3 falhas de pagamento');
        }
    }

    /**
     * ✅ CORREÇÃO: createOrUpdateCustomer sem o ?-> encadeado no HasMany
     * O HasMany não suporta optional chaining como um objeto simples
     */
    protected function createOrUpdateCustomer(Tenant $tenant): Customer
    {
        // Busca subscription existente com customer_id do Stripe
        $existingSubscription = $tenant->subscription()
            ->whereNotNull('stripe_customer_id')
            ->first();

        if ($existingSubscription?->stripe_customer_id) {
            try {
                return $this->stripe->customers->retrieve($existingSubscription->stripe_customer_id);
            } catch (\Exception $e) {
                // Customer não existe mais no Stripe — cria um novo abaixo
                Log::warning('Stripe customer não encontrado, criando novo.', [
                    'tenant_id'          => $tenant->id,
                    'stripe_customer_id' => $existingSubscription->stripe_customer_id,
                ]);
            }
        }

        // Busca email do primeiro usuário do tenant
        $user = $tenant->users()->first();

        return $this->stripe->customers->create([
            'email'    => $user?->email,
            'name'     => $tenant->name,
            'metadata' => [
                'tenant_id' => $tenant->id,
            ],
        ]);
    }

    public function getStripeSubscription(string $subscriptionId): ?\Stripe\Subscription
    {
        try {
            return $this->stripe->subscriptions->retrieve($subscriptionId);
        } catch (\Exception $e) {
            Log::error('Erro ao buscar subscription no Stripe', [
                'subscription_id' => $subscriptionId,
                'error'           => $e->getMessage(),
            ]);
            return null;
        }
    }
}