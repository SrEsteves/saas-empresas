<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Middleware crítico para isolamento de tenants
 * 
 * Verifica se o usuário autenticado tem permissão para acessar o tenant_id informado.
 * Essencial para prevenir vazamento de dados entre tenants.
 */
class EnforceTenantIsolation
{
    public function handle(Request $request, Closure $next)
    {
        // Se não autenticado, deixa passar (será tratado por auth middleware)
        if (!auth()->check()) {
            return $next($request);
        }

        $user = auth()->user();
        
        // Se a rota tem tenant_id, verifica isolamento
        if ($request->route('tenant_id')) {
            $requestedTenantId = $request->route('tenant_id');
            
            // Verifica se o usuário pertence ao tenant requisitado
            if ($user->tenant_id != $requestedTenantId) {
                abort(403, 'Você não tem permissão para acessar este recurso.');
            }
        }

        return $next($request);
    }
}
