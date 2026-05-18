<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Command;

class CreateMissingTenants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:create-missing';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create missing tenants for users that don\'t have one';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $usersWithoutTenant = User::whereNull('tenant_id')->get();

        if ($usersWithoutTenant->isEmpty()) {
            $this->info('✅ All users already have tenants!');
            return 0;
        }

        $this->info("Found {$usersWithoutTenant->count()} users without tenants. Creating tenants...");

        foreach ($usersWithoutTenant as $user) {
            // Create tenant
            $tenant = Tenant::create([
                'name' => $user->name . "'s Business",
                'is_active' => true,
                'status' => 'active',
                'working_hours' => [
                    'monday' => ['08:00', '18:00'],
                    'tuesday' => ['08:00', '18:00'],
                    'wednesday' => ['08:00', '18:00'],
                    'thursday' => ['08:00', '18:00'],
                    'friday' => ['08:00', '18:00'],
                    'saturday' => null,
                    'sunday' => null,
                ],
                'appointment_interval_minutes' => 30,
                'bot_message' => 'Olá! Gostaria de agendar um horário?',
                'confirmation_message' => 'Seu agendamento foi confirmado!',
                'cancellation_message' => 'Seu agendamento foi cancelado.',
            ]);

            // Update user with tenant_id
            $user->update(['tenant_id' => $tenant->id]);

            $this->line("✅ Created tenant '{$tenant->name}' for user {$user->email}");
        }

        $this->info('🎉 All missing tenants created successfully!');
        return 0;
    }
}