<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            
            // Relacionamentos
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            
            // Informações financeiras
            $table->integer('amount'); // Em centavos
            $table->string('currency', 3)->default('BRL');
            $table->enum('status', ['draft', 'sent', 'paid', 'failed', 'refunded'])->default('draft');
            
            // Stripe
            $table->string('stripe_invoice_id')->nullable()->unique();
            
            // Datas
            $table->date('issue_date');
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            
            // Detalhes
            $table->text('description')->nullable();
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->string('invoice_number')->nullable(); // INV-2026-000001
            
            // Auditoria
            $table->timestamps();
            
            // Índices
            $table->index(['tenant_id', 'status']);
            $table->index('stripe_invoice_id');
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
