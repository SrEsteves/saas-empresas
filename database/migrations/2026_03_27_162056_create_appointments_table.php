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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            
            // As duas chaves estrangeiras de segurança:
            $table->foreignIdFor(\App\Models\Tenant::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(\App\Models\Service::class)->constrained()->cascadeOnDelete(); // Qual serviço foi agendado?

            // Dados simples do cliente (ideal para a sua ideia do WhatsApp)
            $table->string('client_name'); 
            $table->string('client_phone')->nullable(); 

            // O coração da agenda:
            $table->dateTime('start_time'); // Quando começa
            $table->dateTime('end_time');   // Quando termina (vamos calcular isso sozinhos!)
            $table->string('status')->default('confirmed'); // confirmed, canceled, completed
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
