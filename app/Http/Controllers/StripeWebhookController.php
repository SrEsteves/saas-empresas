<?php

namespace App\Http\Controllers;

use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function __construct(private StripeService $stripeService)
    {
    }

    /**
     * Lidar com webhooks do Stripe
     * Endpoint: POST /webhooks/stripe
     */
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');

        try {
            // Validar assinatura do Stripe (CRÍTICO!)
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                config('services.stripe.webhook_secret')
            );
        } catch (\UnexpectedValueException $e) {
            // Payload inválido
            Log::warning('Stripe webhook: Invalid payload', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            // Assinatura inválida - muito perigoso!
            Log::warning('Stripe webhook: Invalid signature - SECURITY ALERT', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Log para debugging
        Log::info('Stripe webhook received', [
            'event_type' => $event->type,
            'event_id' => $event->id,
        ]);

        // Processar diferentes tipos de eventos
        try {
            match ($event->type) {
                'invoice.payment_succeeded'      => $this->handleInvoicePaid($event),
                'invoice.payment_failed'         => $this->handleInvoicePaymentFailed($event),
                'customer.subscription.created'  => $this->handleSubscriptionCreated($event),
                'customer.subscription.updated'  => $this->handleSubscriptionUpdated($event),
                'customer.subscription.deleted'  => $this->handleSubscriptionDeleted($event),
                'checkout.session.completed'     => $this->handleCheckoutCompleted($event), // ADICIONA
                default => Log::debug('Unhandled webhook event', ['type' => $event->type]),
            };
        } catch (\Exception $e) {
            Log::error('Error processing webhook', [
                'event_type' => $event->type,
                'error' => $e->getMessage(),
            ]);
            // Retornar 200 mesmo em erro para o Stripe não ficar retentando
        }

        return response()->json(['success' => true]);
    }

    protected function handleCheckoutCompleted($event): void
    {
        $session = $event->data->object;
    
        Log::info('checkout.session.completed data received', [
            'session_id'   => $session->id,
            'subscription' => $session->subscription,
            'customer'     => $session->customer,
            'invoice'      => $session->invoice,
            'metadata'     => $session->metadata->toArray() ?? [], // Log all metadata
        ]);
    
        // Pega tenant_id e plan_id do metadata que passamos no createCheckoutSession
        $tenantId = $session->metadata->tenant_id ?? null;
        $planId   = $session->metadata->plan_id   ?? null;
    
        Log::info('Extracted metadata', [
            'tenant_id' => $tenantId,
            'plan_id'   => $planId,
        ]);

        if (!$tenantId || !$planId) {
            Log::warning('checkout.session.completed sem metadata', [
                'session_id' => $session->id,
                'metadata'   => $session->metadata->toArray() ?? [],
            ]);
            return;
        }

        $tenant = \App\Models\Tenant::find($tenantId);
        $plan   = \App\Models\Plan::find($planId);
    
        if (!$tenant) {
            Log::error('checkout.session.completed: Tenant not found for ID', [
                'tenant_id' => $tenantId,
                'session_id' => $session->id,
            ]);
            return;
        }
        if (!$plan) {
            Log::error('checkout.session.completed: Plan not found for ID', [
                'plan_id'   => $planId,
                'session_id' => $session->id,
            ]);
            return;
        }

        $stripeSubscriptionId = $session->subscription;
        $stripeCustomerId     = $session->customer;
    
        Log::info('Tenant and Plan found, processing subscription details', [
            'tenant_name'          => $tenant->name,
            'plan_name'            => $plan->name,
            'stripe_subscription_id' => $stripeSubscriptionId,
            'stripe_customer_id'     => $stripeCustomerId,
        ]);

        // Tenta buscar as datas reais do Stripe, mas usa fallback seguro se falhar
        $stripeSub   = $stripeSubscriptionId
            ? $this->stripeService->getStripeSubscription($stripeSubscriptionId)
            : null;

        $periodStart = ($stripeSub?->current_period_start)
            ? now()->setTimestamp($stripeSub->current_period_start)
            : now();

        $periodEnd = ($stripeSub?->current_period_end)
            ? now()->setTimestamp($stripeSub->current_period_end)
            : now()->addMonth();
    
        Log::info('Subscription period details', [
            'period_start' => $periodStart->toDateTimeString(),
            'period_end'   => $periodEnd->toDateTimeString(),
        ]);

        // Atualiza a subscription existente (trial) ou cria uma nova
        $subscription = \App\Models\Subscription::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'plan_id'                => $plan->id,
                'status'                 => 'active',
                'stripe_subscription_id' => $stripeSubscriptionId,
                'stripe_customer_id'     => $stripeCustomerId,
                'current_period_start'   => $periodStart,
                'current_period_end'     => $periodEnd,
                'is_trial'               => false,
                'trial_ends_at'          => null,
                'canceled_at'            => null,
                'cancellation_reason'    => null,
            ]
        );

        Log::info('Subscription updateOrCreate result', [
            'subscription_id'        => $subscription->id,
            'subscription_status'    => $subscription->status,
            'is_newly_created'       => $subscription->wasRecentlyCreated, // Check if it was created or updated
        ]);

        // Atualiza o tenant para ativo com o plano correto
        $tenant->update([
            'current_plan_id' => $plan->id,
            'status'          => 'active',
        ]);

        Log::info('Tenant updated after checkout', [
            'tenant_id'       => $tenant->id,
            'tenant_status'   => $tenant->status,
            'current_plan_id' => $tenant->current_plan_id,
        ]);
    
        // Processar a primeira fatura associada a esta sessão de checkout
        if ($session->invoice) {
            Log::info('Processing first invoice from checkout session', [
                'stripe_invoice_id' => $session->invoice,
                'session_id' => $session->id,
            ]);
            $this->stripeService->handleInvoicePaid($session->invoice, $subscription);
        }

        Log::info('Subscription activated via checkout', [
            'tenant_id'              => $tenant->id,
            'plan'                   => $plan->name,
            'stripe_subscription_id' => $stripeSubscriptionId,
        ]);
    }

    /**
     * Webhook: Fatura paga com sucesso
     */
    protected function handleInvoicePaid($event): void
    {
        $stripeInvoice = $event->data->object;

        // Se a fatura é da criação da assinatura, o 'checkout.session.completed' já cuida disso.
        // Ignoramos este evento para evitar a "race condition" onde a fatura chega antes
        // da assinatura ser criada no nosso banco.
        if ($stripeInvoice->billing_reason === 'subscription_create') {
            Log::info('Ignorando invoice.payment_succeeded (subscription_create), pois será tratado pelo checkout.session.completed.', [
                'stripe_invoice_id' => $stripeInvoice->id,
            ]);
            return;
        }

        Log::info('Invoice paid (renewal)', ['stripe_invoice_id' => $stripeInvoice->id]);

        $this->stripeService->handleInvoicePaid($stripeInvoice->id);
    }

    /**
     * Webhook: Falha no pagamento da fatura
     */
    protected function handleInvoicePaymentFailed($event): void
    {
        $stripeInvoiceId = $event->data->object->id;

        Log::warning('Invoice payment failed', ['stripe_invoice_id' => $stripeInvoiceId]);

        $this->stripeService->handleInvoicePaymentFailed($stripeInvoiceId);
    }

    /**
     * Webhook: Subscrição criada
     */
    protected function handleSubscriptionCreated($event): void
    {
        Log::info('Subscription created', [
            'stripe_subscription_id' => $event->data->object->id,
        ]);
    }

    /**
     * Webhook: Subscrição atualizada
     */
    protected function handleSubscriptionUpdated($event): void
    {
        Log::info('Subscription updated', [
            'stripe_subscription_id' => $event->data->object->id,
        ]);
    }

    /**
     * Webhook: Subscrição cancelada
     */
    protected function handleSubscriptionDeleted($event): void
    {
        $stripeSubscription = $event->data->object;
        Log::info('Subscription deleted webhook received', [
            'stripe_subscription_id' => $stripeSubscription->id,
        ]);

        $subscription = \App\Models\Subscription::where('stripe_subscription_id', $stripeSubscription->id)->first();

        if ($subscription) {
            // Atualiza o status final da assinatura local
            $subscription->update([
                'status' => 'canceled',
                'ends_at' => now(), // Marca o fim definitivo
            ]);

            // Suspende o tenant, pois a assinatura paga acabou
            $subscription->tenant->update(['status' => 'suspended']);

            Log::info('Local subscription canceled and tenant suspended', [
                'subscription_id' => $subscription->id,
                'tenant_id' => $subscription->tenant_id,
            ]);
        } else {
            Log::warning('Subscription to be deleted not found locally', [
                'stripe_subscription_id' => $stripeSubscription->id,
            ]);
        }
    }
}
