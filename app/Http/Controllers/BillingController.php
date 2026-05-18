<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Subscription;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BillingController extends Controller
{
    public function __construct(private StripeService $stripeService)
    {
    }

    public function dashboard()
    {
        $tenant       = auth()->user()->tenant;
        $subscription = $tenant->getActiveSubscription();
        $plan         = $subscription?->plan;

        // Se não houver uma assinatura ativa (paga ou trial), usa o plano gratuito como fallback
        if (!$plan) {
            $plan = Plan::where('slug', 'free')->first();
        }

        $invoices = $tenant->invoices()
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($inv) => [
                'id'          => $inv->id,
                'created_at'  => $inv->created_at,
                'description' => $inv->description ?? 'Assinatura ' . ($plan?->name ?? 'Plano'),
                'amount'      => $inv->amount / 100, // Converter de centavos para reais
                'status'      => $inv->status,
                'pdf_url'     => $inv->pdf_url ?? null,
            ]);

            //var_dump($subscription);exit;
        // Uso atual do tenant no mês
        $usage = [
            'appointments_used' => $tenant->appointments()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'employees_used'    => $tenant->employees()->count(),
            'services_used'     => $tenant->services()->count(),
        ];

        return Inertia::render('Billing/Dashboard', [
            'currentSubscription' => $subscription,
            'currentPlan'         => $plan,
            'invoices'            => $invoices,
            'usage'               => $usage,
            'daysLeftOnTrial'     => $subscription?->daysLeftOnTrial() ?? 0,
            'isOnTrial'           => $subscription?->isOnTrial() ?? false,
            'statusSubs'              => $subscription?->status ?? false,
        ]);
    }

    public function showPlans()
    {
        $plans               = Plan::active()->orderBy('monthly_price')->get();
        $currentSubscription = auth()->user()->tenant->getActiveSubscription();

        return Inertia::render('Billing/Plans', [
            'plans'               => $plans,
            'currentPlan'         => $currentSubscription?->plan,
            'currentSubscription' => $currentSubscription,
        ]);
    }

    public function startCheckout(Request $request)
    {
        $request->validate([
            'plan_id'        => 'required|exists:plans,id',
            'billing_period' => 'nullable|in:monthly,yearly',
        ]);

        $plan     = Plan::findOrFail($request->plan_id);
        $isYearly = $request->billing_period === 'yearly';

        try {
            $checkoutUrl = $this->stripeService->createCheckoutSession(
                auth()->user()->tenant,
                $plan,
                $isYearly
            );

            return response()->json([
                'success'      => true,
                'checkout_url' => $checkoutUrl,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function success(Request $request)
    {
        return redirect()->route('billing.dashboard')
            ->with('success', '✅ Assinatura ativada com sucesso!');
    }

    public function canceled()
    {
        return redirect()->route('billing.plans')
            ->with('info', 'Checkout cancelado. Você continua no plano anterior.');
    }

    public function upgrade(Request $request)
    {
        $request->validate([
            'plan_id'        => 'required|exists:plans,id',
            'billing_period' => 'nullable|in:monthly,yearly',
        ]);

        $tenant       = auth()->user()->tenant;
        $subscription = $tenant->getActiveSubscription();

        if (!$subscription) {
            return back()->with('error', 'Nenhuma assinatura ativa encontrada.');
        }

        $newPlan = Plan::findOrFail($request->plan_id);

        if ($subscription->plan_id === $newPlan->id) {
            return back()->with('info', 'Você já está no plano ' . $newPlan->name);
        }

        try {
            $isYearly = $request->billing_period === 'yearly';
            $this->stripeService->upgradePlan($subscription, $newPlan, $isYearly);

            return back()->with('success', '✅ Plano atualizado para ' . $newPlan->name . '!');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao atualizar plano: ' . $e->getMessage());
        }
    }

    public function cancel(Request $request)
    {
        $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $tenant       = auth()->user()->tenant;
        $subscription = $tenant->getActiveSubscription();

        if (!$subscription) {
            return back()->with('error', 'Nenhuma assinatura ativa.');
        }

        try {
            $this->stripeService->cancelSubscription(
                $subscription,
                $request->reason ?? 'Cancelamento solicitado pelo usuário'
            );

            return redirect()->route('billing.plans')
                ->with('success', 'Assinatura cancelada. Você pode reativar a qualquer momento.');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao cancelar: ' . $e->getMessage());
        }
    }

    public function reactivate()
    {
        $tenant       = auth()->user()->tenant;
        $subscription = $tenant->getActiveSubscription();

        if (!$subscription || !$subscription->is_scheduled_for_cancellation) {
            return back()->with('error', 'Nenhuma assinatura agendada para cancelamento foi encontrada.');
        }

        try {
            $this->stripeService->reactivateSubscription($subscription);
            return back()->with('success', '✅ Sua assinatura foi reativada com sucesso!');
        } catch (\Exception $e) {
            return back()->with('error', 'Erro ao reativar assinatura: ' . $e->getMessage());
        }
    }

    public function invoices()
    {
        $invoices = auth()->user()->tenant->invoices()
            ->latest()
            ->paginate(10);

        return Inertia::render('Billing/Invoices', [
            'invoices' => $invoices,
        ]);
    }
}