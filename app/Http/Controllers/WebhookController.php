<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\Appointment;
use Illuminate\Support\Facades\Log;
use App\Services\EvolutionApiService;

class WebhookController extends Controller
{
    public function handle(Request $request, Tenant $tenant)
    {
        // 1. Pega os dados brutos que a Evolution API mandou
        $payload = $request->all();

        // 2. Garante que é uma mensagem recebida (ignora status de "lido", "entregue", etc)
        if (($payload['event'] ?? '') !== 'messages.upsert') {
            return response()->json(['status' => 'ignored_event']);
        }

        $messageData = $payload['data']['message'] ?? null;
        if (!$messageData) return response()->json(['status' => 'no_message']);

        // 3. Verifica se foi o próprio robô que enviou (se for, ignora para não dar loop infinito)
        $fromMe = $payload['data']['key']['fromMe'] ?? true;
        if ($fromMe) return response()->json(['status' => 'from_me']);

        // 4. Pega o número do cliente (A API manda assim: 5511999999999@s.whatsapp.net)
        $remoteJid = $payload['data']['key']['remoteJid'] ?? '';
        $phone = explode('@', $remoteJid)[0];

        // 5. Extrai o texto exato que o cliente digitou
        $text = $messageData['conversation'] ?? $messageData['extendedTextMessage']['text'] ?? '';
        $text = trim($text);

        Log::info("🤖 Webhook Recebido - Cliente: {$phone} | Texto: {$text}");

        // 6. Se o cliente respondeu com texto normal (ex: "Obrigado!"), o robô só ignora
        if ($text !== '1' && $text !== '2') {
            return response()->json(['status' => 'not_a_command']);
        }

        // 7. A INTELIGÊNCIA: Procura o agendamento mais próximo desse cliente a partir de hoje
        $appointment = Appointment::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('client_phone', 'like', "%{$phone}%")
            ->where('start_time', '>=', now())
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('start_time', 'asc')
            ->first();

        // Se o cara respondeu 1 mas não tem agendamento nenhum marcado, ignora.
        if (!$appointment) {
            return response()->json(['status' => 'no_appointment_found']);
        }

        $evolution = new EvolutionApiService();

        // Lógica do 1 (Confirmar)
        if ($text === '1') {
            $appointment->update(['status' => 'confirmed']);
            $evolution->sendText($phone, "✅ Que ótimo! Seu agendamento foi confirmado no nosso sistema. Te esperamos lá!");
        }

        // Lógica do 2 (Cancelar)
        if ($text === '2') {
            $appointment->update(['status' => 'canceled']);
            $evolution->sendText($phone, "❌ Tudo bem. Seu agendamento foi cancelado e a vaga liberada. Até a próxima!");
        }

        return response()->json(['status' => 'success']);
    }
}