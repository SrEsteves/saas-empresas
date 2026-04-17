<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Rastrear plano ativo (redundância com subscriptions, mas útil para queries)
            $table->foreignId('current_plan_id')->nullable()->constrained('plans')->nullOnDelete();
            
            // Status do tenant
            $table->enum('status', ['active', 'suspended', 'on_hold'])->default('active')->after('is_active');
            
            // Rastreamento de uso (para verificar limites)
            $table->integer('appointments_this_month')->default(0);
            $table->timestamp('last_usage_reset_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Plan::class);
            $table->dropColumn(['current_plan_id', 'status', 'appointments_this_month', 'last_usage_reset_at']);
        });
    }
};
