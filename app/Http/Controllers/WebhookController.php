<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\Service;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    // Esta função vai receber as "pancadas" (requisições) do WhatsApp
    public function handle(Request $request, Tenant $tenant)
    {
        \Illuminate\Support\Facades\Log::info("Mensagem recebida para a empresa: {$tenant->name}");
        
        $message = strtolower($request->input('message', ''));
        $clientPhone = $request->input('phone', '');

        $replyText = "";

        // 1. SE O CLIENTE PEDIR ATENDENTE:
        if (preg_match('/(atendente|humano|falar com atendente|ajuda)/i', $message)) {
            
            // Avisa TODOS os usuários vinculados a esta empresa
            $users = $tenant->users;
            foreach ($users as $user) {
                $user->notify(new \App\Notifications\HumanRequestedNotification($clientPhone));
            }

            $replyText = "✅ *Aguarde um momento!*\n\nUm de nossos atendentes já foi notificado e vai assumir essa conversa por aqui em breve.";
        }
        // 2. SE FOR A SAUDAÇÃO NORMAL:
        elseif (preg_match('/(oi|olá|ola|agendar|marcar|horário|horario)/i', $message)) {
            $bookingLink = url("/agendar/{$tenant->id}");

            $rawMessage = $tenant->bot_message ?? "Olá! Acesse nosso calendário clicando aqui:\n\n👉 {link}";
            $replyText = str_replace(['{link}', '{nome_empresa}'], [$bookingLink, $tenant->name], $rawMessage);
        } 
        // 3. SE NÃO ENTENDER:
        else {
            $replyText = "Desculpe, sou o assistente virtual e ainda estou aprendendo. 😅\n\nDigite *Agendar* para ver nossos horários ou *Atendente* para falar com um humano.";
        }

        return response()->json([
            'status' => 'success',
            'reply' => $replyText
        ]);
    }
}