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

        return Inertia::render('Settings/Edit', [
            'tenant' => $tenant,
            'defaultMessage' => $defaultMessage,
            'defaultConfirmation' => $defaultConfirmation,
            'defaultCancellation' => $defaultCancellation,
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
        ]);

        $tenant = auth()->user()->tenant;
        
        $tenant->update([
            'working_hours' => $request->working_hours,
            'closed_dates' => $request->closed_dates,
            'bot_message' => $request->bot_message,
            'confirmation_message' => $request->confirmation_message,
            'cancellation_message' => $request->cancellation_message,
        ]);

        return redirect()->back()->with('success', 'Configurações salvas com sucesso!');
    }
}