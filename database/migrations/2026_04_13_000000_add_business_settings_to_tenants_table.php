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
            $table->integer('appointment_interval_minutes')->default(30)->after('cancellation_message');
            $table->string('logo_path')->nullable()->after('appointment_interval_minutes');
            $table->text('address')->nullable()->after('logo_path');
            $table->string('phone', 20)->nullable()->after('address');
            $table->string('public_url_slug', 100)->nullable()->unique()->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'appointment_interval_minutes',
                'logo_path',
                'address',
                'phone',
                'public_url_slug'
            ]);
        });
    }
};