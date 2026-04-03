<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use App\Services\EvolutionApiService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendReminders extends Command
{
    // 1. O nome do comando que vamos digitar no terminal
    protected $signature = 'app:send-reminders';

    // 2. A descrição do que ele faz
    protected $description = 'Dispara WhatsApp de lembrete para os agendamentos de amanhã';

    public function handle()
    {
        $this->info('Iniciando a busca por clientes de amanhã...');

        // Pega a data de amanhã
        $tomorrow = Carbon::tomorrow()->toDateString();

        $appointments = Appointment::withoutGlobalScopes() 
            ->with(['tenant', 'service', 'employee'])
            ->whereDate('start_time', $tomorrow)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get();

        if ($appointments->isEmpty()) {
            $this->info('Agenda vazia para amanhã. Nenhum lembrete para enviar hoje. 😴');
            return;
        }

        $evolution = new EvolutionApiService();
        $count = 0;

        foreach ($appointments as $appointment) {
            $tenant = $appointment->tenant;
            
            // Proteções caso o serviço ou profissional tenham sido apagados
            $serviceName = $appointment->service ? $appointment->service->name : 'seu serviço';
            $employeeName = $appointment->employee ? $appointment->employee->name : 'nossa equipe';
            
            // Pega só a hora (Ex: 15:30)
            $time = Carbon::parse($appointment->start_time)->format('H:i');

            // Mensagem matadora de lembrete com as opções 1 e 2
            $defaultMessage = "Olá {nome_cliente}! Passando para lembrar do seu horário de *{servico}* amanhã às *{hora}* com *{profissional}* na {nome_empresa}.\n\nResponda *1* para Confirmar ✅ ou *2* para Cancelar ❌ e liberar a vaga.";

            // Substitui as tags mágicas pelos dados reais
            $message = str_replace(
                ['{nome_cliente}', '{servico}', '{hora}', '{profissional}', '{nome_empresa}'],
                [$appointment->client_name, $serviceName, $time, $employeeName, $tenant->name],
                $defaultMessage
            );

            // Dispara a mensagem no WhatsApp do cliente
            $success = $evolution->sendText($appointment->client_phone, $message);

            if ($success) {
                $count++;
                Log::info("✅ Lembrete automático enviado para {$appointment->client_phone}");
                $this->line("-> Mensagem enviada para {$appointment->client_name}");
            }
        }

        $this->info("🤖 Missão cumprida! {$count} lembretes disparados com sucesso.");
    }
}