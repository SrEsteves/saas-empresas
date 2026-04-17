<?php

namespace App\Console\Commands;

use App\Services\StripeService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:sync-stripe-invoices')]
#[Description('Sincronizar faturas do Stripe para o banco de dados local')]
class SyncStripeInvoices extends Command
{
    public function __construct(private StripeService $stripeService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Sincronizando faturas do Stripe...');

        $this->stripeService->syncAllInvoices();

        $this->info('Faturas sincronizadas com sucesso!');
    }
}
