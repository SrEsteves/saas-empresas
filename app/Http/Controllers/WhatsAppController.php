<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Services\EvolutionApiService;

class WhatsAppController extends Controller
{
    public function index()
    {
        // No futuro, buscaremos as conversas reais aqui.
        // Por enquanto, vamos mandar os agendamentos "pendentes" (que o bot tentou marcar)
        $pendingAppointments = Appointment::with('service')
            ->where('status', 'pending') // <-- Lembra que criamos o status na tabela?
            ->get();

        return Inertia::render('WhatsApp/Index', [
            'pendingAppointments' => $pendingAppointments
        ]);
    }

    public function accept(Appointment $appointment)
    {
        $appointment->update(['status' => 'confirmed']);

        $tenant = auth()->user()->tenant;
        $date = \Carbon\Carbon::parse($appointment->start_time)->format('d/m/Y \à\s H:i');
        
        // Pega a mensagem customizada do banco (ou uma de segurança se estiver vazio)
        $rawMessage = $tenant->confirmation_message ?? "Agendamento confirmado para {data_hora}.";

        // Faz a substituição MÁGICA das variáveis
        $message = str_replace(
            ['{nome_cliente}', '{data_hora}', '{nome_empresa}'],
            [$appointment->client_name, $date, $tenant->name],
            $rawMessage
        );

        $evolution = new EvolutionApiService();
        $evolution->sendText($appointment->client_phone, $message);

        return redirect()->back()->with('success', 'Agendamento aceito e mensagem enviada!');
    }

    public function reject(Appointment $appointment)
    {
        $appointment->update(['status' => 'canceled']);

        $tenant = auth()->user()->tenant;
        
        $rawMessage = $tenant->cancellation_message ?? "Seu agendamento foi cancelado.";

        $message = str_replace(
            ['{nome_cliente}', '{nome_empresa}'],
            [$appointment->client_name, $tenant->name],
            $rawMessage
        );

        \Illuminate\Support\Facades\Log::info("🚀 [WHATSAPP OUT] Cancelamento para {$appointment->client_phone}: \n{$message}");

        return redirect()->back()->with('success', 'Agendamento recusado e cliente avisado.');
    }
}