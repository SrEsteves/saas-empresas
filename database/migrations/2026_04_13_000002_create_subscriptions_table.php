<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            
            // Relacionamentos
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->restrictOnDelete();
            
            // Status
            $table->enum('status', ['trial', 'active', 'canceled', 'expired'])->default('trial');
            
            // Período
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            
            // Stripe
            $table->string('stripe_subscription_id')->nullable()->unique();
            $table->string('stripe_customer_id')->nullable();
            $table->string('payment_method_last4')->nullable(); // Últimos 4 dígitos do cartão
            
            // Flag para trial
            $table->boolean('is_trial')->default(true);
            
            // Tentativas de pagamento falhadas
            $table->integer('failed_payment_attempts')->default(0);
            $table->timestamp('last_payment_failed_at')->nullable();
            
            // Auditoria
            $table->timestamp('last_renewed_at')->nullable();
            $table->timestamps();
            
            // Índices para queries comuns
            $table->index(['tenant_id', 'status']);
            $table->index('stripe_customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
