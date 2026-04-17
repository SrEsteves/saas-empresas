<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class StripeSetupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stripe:setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Configure Stripe integration for the SaaS platform';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔐 Stripe Setup Assistant');
        $this->line('This command will help you configure Stripe for your SaaS platform.');
        $this->newLine();

        // Check if .env file exists
        $envPath = base_path('.env');
        if (!file_exists($envPath)) {
            $this->error('❌ .env file not found. Please create it first.');
            return 1;
        }

        // Check current configuration
        $this->info('📋 Current Stripe Configuration:');
        $publicKey = config('services.stripe.public_key');
        $secretKey = config('services.stripe.secret');
        $webhookSecret = config('services.stripe.webhook_secret');

        $this->line('Public Key: ' . ($publicKey ? '✅ Configured' : '❌ Not configured'));
        $this->line('Secret Key: ' . ($secretKey ? '✅ Configured' : '❌ Not configured'));
        $this->line('Webhook Secret: ' . ($webhookSecret ? '✅ Configured' : '❌ Not configured'));
        $this->newLine();

        // Ask for configuration
        if (!$this->confirm('Do you want to configure Stripe keys now?', true)) {
            $this->info('Setup cancelled. You can run this command again later.');
            return 0;
        }

        $this->info('🔑 Step 1: Get your Stripe keys from https://dashboard.stripe.com/apikeys');
        $this->line('You need:');
        $this->line('• Publishable key (starts with pk_test_ or pk_live_)');
        $this->line('• Secret key (starts with sk_test_ or sk_live_)');
        $this->line('• Webhook signing secret (from webhook settings)');
        $this->newLine();

        // Get keys from user
        $publicKey = $this->ask('Enter your Stripe Publishable Key', $publicKey);
        $secretKey = $this->secret('Enter your Stripe Secret Key', $secretKey);
        $webhookSecret = $this->ask('Enter your Stripe Webhook Signing Secret (optional)', $webhookSecret);

        // Update .env file
        $this->updateEnvFile($envPath, 'STRIPE_PUBLIC_KEY', $publicKey);
        $this->updateEnvFile($envPath, 'STRIPE_SECRET_KEY', $secretKey);
        if ($webhookSecret) {
            $this->updateEnvFile($envPath, 'STRIPE_WEBHOOK_SECRET', $webhookSecret);
        }

        // Clear config cache
        $this->call('config:clear');

        $this->newLine();
        $this->info('✅ Stripe configuration updated!');
        $this->info('📝 Next steps:');
        $this->line('1. Create products and prices in your Stripe dashboard');
        $this->line('2. Update the price IDs in your .env file');
        $this->line('3. Test the integration with stripe:test command');
        $this->newLine();

        return 0;
    }

    private function updateEnvFile(string $path, string $key, string $value): void
    {
        $content = file_get_contents($path);

        // Check if key exists
        if (preg_match("/^{$key}=.*$/m", $content)) {
            // Update existing key
            $content = preg_replace("/^{$key}=.*$/m", "{$key}={$value}", $content);
        } else {
            // Add new key
            $content .= "\n{$key}={$value}";
        }

        file_put_contents($path, $content);
    }
}
