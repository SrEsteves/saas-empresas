<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free',
                'slug' => 'free',
                'description' => 'Plano gratuito para testar o AgendaPro',
                'monthly_price' => 0,
                'yearly_price' => 0,
                'max_appointments_per_month' => 50,
                'max_employees' => 1,
                'max_services' => 10,
                'max_products' => 20,
                'max_categories' => 5,
                'features' => ['basic_scheduling', 'whatsapp_integration'],
                'trial_days' => 14,
                'is_active' => true,
            ],
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Para pequenos negócios começando a crescer',
                'monthly_price' => 4999, // R$ 49.99
                'yearly_price' => 49990, // R$ 499.90 (2 meses de desconto)
                'max_appointments_per_month' => 500,
                'max_employees' => 5,
                'max_services' => 50,
                'max_products' => 100,
                'max_categories' => 20,
                'features' => [
                    'basic_scheduling',
                    'whatsapp_integration',
                    'employee_management',
                    'custom_messages',
                    'email_notifications',
                ],
                'trial_days' => 7,
                'is_active' => true,
                'stripe_monthly_price_id' => env('STRIPE_STARTER_MONTHLY_PRICE_ID'),
                'stripe_yearly_price_id' => env('STRIPE_STARTER_YEARLY_PRICE_ID'),
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'Para negócios em expansão',
                'monthly_price' => 14999, // R$ 149.99
                'yearly_price' => 149990, // R$ 1499.90 (1 mês de desconto)
                'max_appointments_per_month' => 5000,
                'max_employees' => 20,
                'max_services' => null, // ilimitado
                'max_products' => null,
                'max_categories' => null,
                'features' => [
                    'basic_scheduling',
                    'whatsapp_integration',
                    'employee_management',
                    'custom_messages',
                    'email_notifications',
                    'stock_management',
                    'reports_and_analytics',
                    'api_access',
                ],
                'trial_days' => 7,
                'is_active' => true,
                'stripe_monthly_price_id' => env('STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID'),
                'stripe_yearly_price_id' => env('STRIPE_PROFESSIONAL_YEARLY_PRICE_ID'),
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Para grandes operações com necessidades customizadas',
                'monthly_price' => 0, // Preço sob demanda
                'yearly_price' => 0,
                'max_appointments_per_month' => null, // ilimitado
                'max_employees' => null,
                'max_services' => null,
                'max_products' => null,
                'max_categories' => null,
                'features' => [
                    'basic_scheduling',
                    'whatsapp_integration',
                    'employee_management',
                    'custom_messages',
                    'email_notifications',
                    'stock_management',
                    'reports_and_analytics',
                    'api_access',
                    'sso_integration',
                    'custom_integration',
                    'priority_support',
                    'dedicated_account_manager',
                ],
                'trial_days' => 30,
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
