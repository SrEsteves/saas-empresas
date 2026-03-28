<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionApiService
{
    public function sendText($phone, $message)
    {
        $baseUrl  = config('services.evolution.url');
        $apiKey   = config('services.evolution.key');
        $instance = config('services.evolution.instance');

        // 1. Limpa o telefone (tira traços e espaços se houver)
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);

        // 2. Garante o DDI (55)
        // O seu 11986818179 vira 5511986818179 automaticamente aqui!
        if (!str_starts_with($cleanPhone, '55')) {
            $cleanPhone = '55' . $cleanPhone;
        }

        $endpoint = "{$baseUrl}/message/sendText/{$instance}";

        try {
            // Limite de 10 segundos (Http::timeout(10)) para não travar a sua tela!
            $response = Http::timeout(10)->withHeaders([
                'apikey' => $apiKey,
                'Content-Type' => 'application/json'
            ])->post($endpoint, [
                'number' => $cleanPhone,
                'text' => $message
                // Removemos o 'options' (delay/composing) para parar de dar Timeout na API
            ]);

            if ($response->successful()) {
                Log::info("✅ [EVOLUTION API] Mensagem enviada para {$cleanPhone}");
                return true;
            }

            Log::error("❌ [EVOLUTION API] Erro ao enviar para {$cleanPhone}: " . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error("🔥 [EVOLUTION API] Falha de conexão: " . $e->getMessage());
            return false;
        }
    }
}