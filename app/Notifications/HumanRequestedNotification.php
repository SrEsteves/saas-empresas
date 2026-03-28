<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class HumanRequestedNotification extends Notification
{
    use Queueable;

    public $phone;

    // Recebe o telefone do cliente que pediu ajuda
    public function __construct($phone)
    {
        $this->phone = $phone;
    }

    // Diz pro Laravel salvar essa notificação no Banco de Dados
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    // Os dados que vão aparecer no "sininho" do sistema
    public function toArray(object $notifiable): array
    {
        return [
            'message' => 'Um cliente solicitou atendimento humano no WhatsApp.',
            'phone' => $this->phone,
            'type' => 'human_help'
        ];
    }
}