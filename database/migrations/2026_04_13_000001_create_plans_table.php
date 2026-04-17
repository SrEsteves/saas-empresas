<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            
            // Informações básicas
            $table->string('name')->unique(); // FREE, STARTER, PROFISSIONAL, EMPRESA
            $table->string('slug')->unique(); // free, starter, professional, enterprise
            $table->text('description')->nullable();
            
            // Preços (em centavos para evitar problemas com float)
            $table->integer('monthly_price')->default(0); // 0 = gratuito
            $table->integer('yearly_price')->nullable();
            
            // Limites
            $table->integer('max_appointments_per_month')->nullable(); // null = ilimitado
            $table->integer('max_employees')->nullable();
            $table->integer('max_services')->nullable();
            $table->integer('max_products')->nullable();
            $table->integer('max_categories')->nullable();
            
            // Features (JSON array de strings)
            // Ex: ["whatsapp_integration", "employee_management", "stock_management"]
            $table->json('features')->nullable();
            
            // Metadados
            $table->integer('trial_days')->default(14); // Dias de trial para novo usuário
            $table->boolean('is_active')->default(true);
            $table->text('stripe_monthly_price_id')->nullable(); // ID do price no Stripe
            $table->text('stripe_yearly_price_id')->nullable(); // ID do price no Stripe
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
