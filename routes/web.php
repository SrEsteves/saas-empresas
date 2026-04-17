<?php

use App\Http\Controllers\BillingController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\WhatsAppController;
use App\Http\Controllers\PublicBookingController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

    //AGENDAMENTO
    Route::get('/agendar/{tenant}', [PublicBookingController::class, 'index'])->name('public.book');
    Route::post('/agendar/{tenant}', [PublicBookingController::class, 'store'])->name('public.store');
    Route::get('/agendar/{tenant}/slots', [PublicBookingController::class, 'getAvailableSlots'])->name('public.slots');
    Route::get('/agendar/{tenant}/employees', [PublicBookingController::class, 'getEmployeesForService'])->name('public.employees');

    //WhatsBot
    Route::post('/webhook/whatsapp/{tenant}', [WebhookController::class, 'handle'])->name('webhook.whatsapp');

    // Stripe Webhook (sem CSRF)
    Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle'])
        ->name('stripe.webhook')
        ->withoutMiddleware(['App\Http\Middleware\VerifyCsrfToken']);

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    //SERVICES AQUI
    Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
    Route::post('/services', [ServiceController::class, 'store'])->name('services.store');
    Route::put('/servicos/{service}', [\App\Http\Controllers\ServiceController::class, 'update'])->name('services.update');
    Route::delete('/servicos/{service}', [\App\Http\Controllers\ServiceController::class, 'destroy'])->name('services.destroy');

    // APPOINTMENTS AQUI
    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');
    Route::post('/appointments/{appointment}/complete', [AppointmentController::class, 'complete'])->name('appointments.complete');

    //WHATSAPP
    Route::get('/whatsapp', [WhatsAppController::class, 'index'])->name('whatsapp.index');
    Route::post('/whatsapp/{appointment}/accept', [WhatsAppController::class, 'accept'])->name('whatsapp.accept');
    Route::post('/whatsapp/{appointment}/reject', [WhatsAppController::class, 'reject'])->name('whatsapp.reject');

    //PARAMETRIZAÇÃO
    Route::get('/configuracoes', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::put('/configuracoes', [SettingsController::class, 'update'])->name('settings.update');

    // PROFISSIONAIS AQUI
    Route::get('/profissionais', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/profissionais', [EmployeeController::class, 'store'])->name('employees.store');
    Route::put('/profissionais/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('/profissionais/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

    //PRODUTOS
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::post('/products/{product}/adjust', [ProductController::class, 'adjustStock'])->name('products.adjust');

    //CATEGORIAS
    Route::resource('categories', CategoryController::class)->only(['index', 'store', 'destroy']);

    //MOVIMENTAÇÕES DE ESTOQUE
    Route::get('/stock/movements', [StockMovementController::class, 'index'])->name('stock.movements');

    //NOTIFICATION
    Route::post('/notificacoes/{id}/ler', function (\Illuminate\Http\Request $request, $id) {
        // Busca a notificação específica do usuário e marca como lida
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();
        
        return back();
    })->name('notifications.read.single');

    // ==================== BILLING ====================
    Route::get('/billing', [BillingController::class, 'dashboard'])->name('billing.dashboard');
    Route::get('/billing/plans', [BillingController::class, 'showPlans'])->name('billing.plans');
    Route::post('/billing/checkout', [BillingController::class, 'startCheckout'])->name('billing.checkout');
    Route::get('/billing/success', [BillingController::class, 'success'])->name('billing.success');
    Route::get('/billing/canceled', [BillingController::class, 'canceled'])->name('billing.canceled');
    Route::post('/billing/upgrade', [BillingController::class, 'upgrade'])->name('billing.upgrade');
    Route::post('/billing/cancel', [BillingController::class, 'cancel'])->name('billing.cancel');
    Route::get('/billing/invoices', [BillingController::class, 'invoices'])->name('billing.invoices');
    
});

require __DIR__.'/auth.php';
