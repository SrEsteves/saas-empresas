<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function edit()
    {
        $tenant = auth()->user()->tenant;

        $defaultMessage = "Olá! Bem-vindo(a) à *{nome_empresa}* 🤖\n\nPara ver nossos serviços, preços e horários disponíveis, acesse rapidamente nosso calendário clicando no link abaixo:\n\n👉 {link}\n\nSeu pedido será enviado direto para a nossa recepção aprovar!";
        
        $defaultConfirmation = "✅ *Agendamento Confirmado!*\n\nOlá {nome_cliente}, seu horário na *{nome_empresa}* foi confirmado para o dia *{data_hora}*.\n\nTe esperamos lá!";
        
        $defaultCancellation = "❌ *Aviso de Cancelamento*\n\nOlá {nome_cliente}, infelizmente não conseguimos confirmar seu agendamento na *{nome_empresa}* para o horário solicitado.\n\nPor favor, acesse nosso link para agendar um novo horário.";

        // Verificar se é um novo usuário (sem configurações básicas)
        // Só considera novo setup se TODOS os campos estão vazios
        $isNewSetup = empty($tenant->public_url_slug) && empty($tenant->address) && empty($tenant->working_hours);

        return Inertia::render('Settings/Edit', [
            'tenant' => $tenant,
            'defaultMessage' => $defaultMessage,
            'defaultConfirmation' => $defaultConfirmation,
            'defaultCancellation' => $defaultCancellation,
            'isNewSetup' => $isNewSetup,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'working_hours' => 'nullable|array',
            'closed_dates' => 'nullable|array',
            'bot_message' => [
                'required', 'string',
                function ($attribute, $value, $fail) {
                    if (!str_contains($value, '{link}')) {
                        $fail('A mensagem inicial precisa conter a variável {link}.');
                    }
                },
            ],
            'confirmation_message' => 'required|string',
            'cancellation_message' => 'required|string',
            'appointment_interval_minutes' => 'nullable|integer|min:15|max:480',
            'logo_path' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'public_url_slug' => 'nullable|string|max:100|unique:tenants,public_url_slug,' . auth()->user()->tenant->id,
        ]);

        $tenant = auth()->user()->tenant;
        
        // Verificar se era um novo setup antes da atualização
        $wasNewSetup = !$tenant->working_hours && !$tenant->address && !$tenant->public_url_slug;
        
        $tenant->update([
            'working_hours' => $request->working_hours,
            'closed_dates' => $request->closed_dates,
            'bot_message' => $request->bot_message,
            'confirmation_message' => $request->confirmation_message,
            'cancellation_message' => $request->cancellation_message,
            'appointment_interval_minutes' => $request->appointment_interval_minutes ?? 30,
            'logo_path' => $request->logo_path,
            'address' => $request->address,
            'phone' => $request->phone,
            'public_url_slug' => $request->public_url_slug,
        ]);

        // Se era novo setup e agora tem dados básicos, redirecionar para dashboard
        if ($wasNewSetup && $request->public_url_slug && $request->address && $request->working_hours) {
            return redirect(route('dashboard'))->with('success', 'Sistema ativado com sucesso! Bem-vindo ao AgendaPro!');
        }

        return redirect()->back()->with('success', 'Configurações salvas com sucesso!');
    }
}