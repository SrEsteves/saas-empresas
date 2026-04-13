<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Service;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\EvolutionApiService;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Symfony\Component\VarDumper\VarDumper;

class AppointmentController extends Controller
{
    public function index()
    {
        $appointments = Appointment::with('service')
            ->where('status', 'confirmed') 
            ->orderBy('start_time')
            ->get();
        
        $services = Service::where('is_active', true)->get();

        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
            'services' => $services
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'client_name' => 'required|string|max:255',
            'client_phone' => 'nullable|string|max:20',
            'start_time' => 'required|date',
        ]);

        $service = Service::findOrFail($request->service_id);
        $startTime = Carbon::parse($request->start_time);
        $endTime = $startTime->copy()->addMinutes($service->duration_minutes);
        $tenant = auth()->user()->tenant;

        $date = $startTime->toDateString();
        $dayOfWeek = strtolower($startTime->englishDayOfWeek);

        $closedDates = $tenant->closed_dates ?? [];
        if (in_array($date, $closedDates)) {
            return back()->withErrors(['start_time' => 'Não é possível agendar: A empresa está fechada nesta data (Feriado/Bloqueio).'])->withInput();
        }

        $workingHours = $tenant->working_hours ?? [];
        if (!isset($workingHours[$dayOfWeek]) || empty($workingHours[$dayOfWeek]['isOpen'])) {
            return back()->withErrors(['start_time' => 'Não é possível agendar: A empresa não abre neste dia da semana.'])->withInput();
        }

        $businessStart = Carbon::parse($date . ' ' . $workingHours[$dayOfWeek]['start']);
        $businessEnd = Carbon::parse($date . ' ' . $workingHours[$dayOfWeek]['end']);

        if ($startTime->lt($businessStart) || $endTime->gt($businessEnd)) {
            return back()->withErrors(['start_time' => "Fora do expediente! O horário de funcionamento para este dia é de {$workingHours[$dayOfWeek]['start']} às {$workingHours[$dayOfWeek]['end']}."])->withInput();
        }

        $conflict = Appointment::where('status', '!=', 'canceled')
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })->exists();

        if ($conflict) {
            return back()->withErrors([
                'start_time' => 'Já existe um agendamento para este horário. Por favor, escolha outro.'
            ])->withInput();
        }

        Appointment::create([
            'service_id' => $service->id,
            'client_name' => $request->client_name,
            'client_phone' => $request->client_phone,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'confirmed',
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Appointment $appointment)
    {
        $request->validate([
            'start_time' => 'required|date',
        ]);

        $startTime = Carbon::parse($request->start_time);
        $duration = $appointment->service ? $appointment->service->duration_minutes : 30;
        $endTime = $startTime->copy()->addMinutes($duration);
        $tenant = auth()->user()->tenant;

        $date = $startTime->toDateString();
        $dayOfWeek = strtolower($startTime->englishDayOfWeek);

        $closedDates = $tenant->closed_dates ?? [];
        if (in_array($date, $closedDates)) {
            return back()->withErrors(['start_time' => 'Data indisponível: A empresa está fechada nesta data.']);
        }

        $workingHours = $tenant->working_hours ?? [];
        if (!isset($workingHours[$dayOfWeek]) || empty($workingHours[$dayOfWeek]['isOpen'])) {
            return back()->withErrors(['start_time' => 'Data indisponível: A empresa não abre neste dia da semana.']);
        }

        $businessStart = Carbon::parse($date . ' ' . $workingHours[$dayOfWeek]['start']);
        $businessEnd = Carbon::parse($date . ' ' . $workingHours[$dayOfWeek]['end']);

        if ($startTime->lt($businessStart) || $endTime->gt($businessEnd)) {
            return back()->withErrors(['start_time' => "Fora do expediente! Horário permitido hoje: {$workingHours[$dayOfWeek]['start']} às {$workingHours[$dayOfWeek]['end']}."]);
        }

        $conflict = Appointment::where('id', '!=', $appointment->id)
            ->where('status', '!=', 'canceled') 
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })->exists();

        if ($conflict) {
            return back()->withErrors(['start_time' => 'Choque de horários! Já existe outro agendamento aqui.']);
        }

        $appointment->update([
            'start_time' => $startTime,
            'end_time' => $endTime,
        ]);

        return redirect()->back();
    }

    public function destroy(Request $request, Appointment $appointment)
    {
        // 1. Recebe a justificativa do frontend (se não vier nada, usa um padrão)
        $reason = $request->input('reason', 'Motivo não informado pelo estabelecimento.');

        // 2. Muda o status para cancelado
        $appointment->update(['status' => 'canceled']);

        // 3. Prepara a mensagem do WhatsApp avisando o cliente!
        $tenant = auth()->user()->tenant;
        
        // Usamos uma mensagem padrão caso o salão não tenha configurado uma
        $rawMessage = $tenant->cancellation_message ?? "Olá {nome_cliente}! Seu agendamento na {nome_empresa} precisou ser cancelado.\n\n*Motivo:* {justificativa}";
        
        // Cria o link público de agendamento do salão
        $bookingLink = url('/agendar/' . $tenant->slug); 
        // Se você não usa slug, mude para: url('/agendar/' . $tenant->id)

        $message = str_replace(
            ['{nome_cliente}', '{nome_empresa}', '{justificativa}', '{link}'],
            [$appointment->client_name, $tenant->name, $reason, $bookingLink],
            $rawMessage
        );

        // Disparo Real pelo Evolution API:
        $evolution = new \App\Services\EvolutionApiService();
        $evolution->sendText($appointment->client_phone, $message);

        return redirect()->back()->with('success', 'Agendamento cancelado com sucesso e cliente avisado!');
    }

    public function complete(Appointment $appointment)
    {
        // 1. Evita processar algo que já foi concluído ou cancelado
        if ($appointment->status !== 'confirmed') {
            return back()->withErrors(['error' => 'Apenas agendamentos confirmados podem ser concluídos.']);
        }

        // 2. Carregamos o serviço com a "receita" de produtos (Pilar 2)
        $service = $appointment->service()->with('products')->first();

        DB::transaction(function () use ($appointment, $service) {
            // 3. Muda o status para concluído
            $appointment->update(['status' => 'completed']);

            // 4. Se o serviço tiver produtos vinculados, damos a baixa
            if ($service && $service->products->isNotEmpty()) {
                foreach ($service->products as $product) {
                    $quantityToConsume = $product->pivot->quantity;

                    // Registra a movimentação de saída
                    StockMovement::create([
                        'tenant_id'  => auth()->user()->tenant_id,
                        'product_id' => $product->id,
                        'quantity'   => -$quantityToConsume,
                        'type'       => 'out',
                        'reason'     => "Consumo automático: Agendamento #{$appointment->id} ({$service->name})"
                    ]);

                    // Decrementa o estoque real
                    $product->decrement('current_stock', $quantityToConsume);
                }
            }
        });

        return redirect()->back()->with('success', 'Agendamento concluído e estoque atualizado com sucesso!');
    }
}