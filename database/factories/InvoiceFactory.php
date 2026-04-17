<?php

namespace Database\Factories;

use App\Models\Tenant;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $issueDate = $this->faker->dateTimeBetween('-6 months', 'now');
        $dueDate = $this->faker->dateTimeBetween($issueDate, '+30 days');
        
        // Get or create a tenant
        $tenant = Tenant::first() ?? Tenant::factory()->create();
        
        // Get or create a subscription for this tenant
        $subscription = $tenant->subscription()->first();
        if (!$subscription) {
            // Create a basic subscription if none exists
            $subscription = $tenant->subscription()->create([
                'plan_id' => 1, // Assume plan ID 1 exists
                'status' => 'active',
                'current_period_start' => now(),
                'current_period_end' => now()->addMonth(),
                'trial_ends_at' => null,
            ]);
        }
        
        return [
            'tenant_id' => $tenant->id,
            'subscription_id' => $subscription->id,
            'amount' => $this->faker->numberBetween(5000, 50000), // 50 to 500 BRL in cents
            'currency' => 'BRL',
            'status' => $this->faker->randomElement(['draft', 'sent', 'paid', 'failed', 'refunded']),
            'stripe_invoice_id' => 'in_' . $this->faker->unique()->randomNumber(8),
            'issue_date' => $issueDate->format('Y-m-d'),
            'due_date' => $dueDate->format('Y-m-d'),
            'paid_at' => $this->faker->optional(0.8)->dateTimeBetween($issueDate, 'now'), // 80% paid
            'description' => 'Assinatura ' . $this->faker->randomElement(['Básico', 'Profissional', 'Premium']),
            'discount_amount' => $this->faker->optional(0.2, 0)->numberBetween(0, 1000), // 20% chance of discount, default 0
            'invoice_number' => 'INV-' . date('Y') . '-' . str_pad($this->faker->unique()->numberBetween(1, 999999), 6, '0', STR_PAD_LEFT),
        ];
    }
}
