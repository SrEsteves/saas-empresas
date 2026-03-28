<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Vamos guardar os horários e os dias de folga no formato JSON para caber tudo numa coluna só
            $table->json('working_hours')->nullable();
            $table->json('closed_dates')->nullable();
            // A mensagem personalizada do bot
            $table->text('bot_message')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['working_hours', 'closed_dates', 'bot_message']);
        });
    }
};
