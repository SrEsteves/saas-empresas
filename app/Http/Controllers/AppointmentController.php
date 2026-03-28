<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Service;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\EvolutionApiService;

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

    public function destroy(Appointment $appointment)
    {
        $appointment->update(['status' => 'canceled']);

        $tenant = auth()->user()->tenant;
        $rawMessage = $tenant->cancellation_message ?? "Seu agendamento foi cancelado.";
        
        $message = str_replace(
            ['{nome_cliente}', '{nome_empresa}'],
            [$appointment->client_name, $tenant->name],
            $rawMessage
        );

        $evolution = new EvolutionApiService();
        $evolution->sendText($appointment->client_phone, $message);

        return redirect()->back()->with('success', 'Agendamento cancelado com sucesso e horário liberado!');
    }
}