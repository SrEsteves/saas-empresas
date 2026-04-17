<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Middleware para verificar se o tenant tem subscrição ativa
 * Redireciona para página de checkout se expirado
 */
class CheckActiveSubscription
{
    public function handle(Request $request, Closure $next)
    {
        if (!auth()->check()) {
            return $next($request);
        }

        $tenant = auth()->user()->tenant;

        // Se não tem subscrição ativa nem está em trial
        if (!$tenant->hasActiveSubscription() && !$tenant->isOnTrial()) {
            // Parou de pagar - redireciona para upgrade
            if ($request->wantsJson()) {
                return response()->json([
                    'error' => 'Seu plano expirou. Renove sua subscrição para continuar.',
                    'redirect' => route('billing.upgrade'),
                ], 403);
            }

            return redirect()->route('billing.upgrade')
                ->with('warning', 'Sua subscrição expirou. Renove agora para continuar usando o sistema.');
        }

        return $next($request);
    }
}
