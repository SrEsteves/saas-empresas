<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\Employee;
use Inertia\Inertia;
use Carbon\Carbon;

class PublicBookingController extends Controller
{
    public function index(Tenant $tenant)
    {
        $services = Service::withoutGlobalScope('tenant_isolation')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Public/Booking', [
            'tenant' => $tenant,
            'services' => $services
        ]);
    }

    public function getEmployeesForService(Request $request, Tenant $tenant)
    {
        $request->validate(['service_id' => 'required|exists:services,id']);
        
        $employees = Employee::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->whereHas('services', function ($q) use ($request) {
                $q->where('services.id', $request->service_id);
            })->get(['id', 'name']);

        return response()->json($employees);
    }

    public function getAvailableSlots(Request $request, Tenant $tenant)
    {
        $request->validate([
            'date' => 'required|date',
            'service_id' => 'required|exists:services,id',
            'employee_id' => 'required|exists:employees,id', // 🌟 AGORA EXIGE O PROFISSIONAL
        ]);

        $date = $request->date;
        $service = Service::withoutGlobalScope('tenant_isolation')->find($request->service_id);
        $duration = $service->duration_minutes;
        $employee = Employee::where('tenant_id', $tenant->id)->findOrFail($request->employee_id);

        // 1. BLINDAGEM DE FERIADOS: Verifica se a data escolhida é um dia de folga da empresa
        $closedDates = $tenant->closed_dates ?? [];
        if (in_array($date, $closedDates)) {
            return response()->json([]);
        }

        $dayOfWeek = strtolower(\Carbon\Carbon::parse($date)->englishDayOfWeek);

        // 2. Horários da Empresa
        $tenantHours = $tenant->working_hours ?? [];
        if (!isset($tenantHours[$dayOfWeek]) || empty($tenantHours[$dayOfWeek]['isOpen'])) {
            return response()->json([]); 
        }

        // 3. Horários do Profissional (Se ele tiver horário próprio usa o dele, senão usa o da empresa)
        $empHours = $employee->working_hours ?? [];
        if (isset($empHours[$dayOfWeek]) && empty($empHours[$dayOfWeek]['isOpen'])) {
            return response()->json([]); // Profissional de folga neste dia
        }

        $startTimeString = $empHours[$dayOfWeek]['start'] ?? $tenantHours[$dayOfWeek]['start'];
        $endTimeString = $empHours[$dayOfWeek]['end'] ?? $tenantHours[$dayOfWeek]['end'];

        [$startHour, $startMinute] = explode(':', $startTimeString);
        [$endHour, $endMinute] = explode(':', $endTimeString);

        $startOfDay = \Carbon\Carbon::parse($date)->setTime((int)$startHour, (int)$startMinute);
        $endOfDay = \Carbon\Carbon::parse($date)->setTime((int)$endHour, (int)$endMinute);

        $appointments = Appointment::withoutGlobalScope('tenant_isolation')
            ->where('tenant_id', $tenant->id)
            ->where('employee_id', $employee->id) 
            ->whereDate('start_time', $date)
            ->whereIn('status', ['confirmed', 'pending'])
            ->get();

        $slots = [];
        $currentTime = $startOfDay->copy();

        while ($currentTime->copy()->addMinutes($duration)->lte($endOfDay)) {
            $slotStart = $currentTime->copy();
            $slotEnd = $currentTime->copy()->addMinutes($duration);

            $conflict = $appointments->contains(function ($app) use ($slotStart, $slotEnd) {
                return $slotStart->lt(\Carbon\Carbon::parse($app->end_time)) &&
                       $slotEnd->gt(\Carbon\Carbon::parse($app->start_time));
            });

            if (!$conflict) {
                if (!($date == now()->toDateString() && $slotStart->isPast())) {
                    $slots[] = $slotStart->format('H:i');
                }
            }
            
            $currentTime->addMinutes(30);
        }

        return response()->json($slots);
    }

    public function store(Request $request, Tenant $tenant)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'employee_id' => 'required|exists:employees,id', // 🌟 VALIDAÇÃO NOVA
            'client_name' => 'required|string|max:255',
            'client_phone' => 'required|string|max:20',
            'start_time' => 'required|date',
        ]);

        $service = Service::withoutGlobalScope('tenant_isolation')->findOrFail($request->service_id);
        
        $startTime = Carbon::parse($request->start_time);
        $endTime = $startTime->copy()->addMinutes($service->duration_minutes);

        //enviar uma notificação para o sistema avisando que um cliente pediu atendimento humano no WhatsApp
        foreach ($tenant->users as $user) {
            $user->notify(new \App\Notifications\HumanRequestedNotification($request->client_phone));
        }

        Appointment::forceCreate([
            'tenant_id' => $tenant->id,
            'service_id' => $service->id,
            'employee_id' => $request->employee_id, // 🌟 SALVA NO BANCO
            'client_name' => $request->client_name,
            'client_phone' => $request->client_phone,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'pending', 
        ]);

        return redirect()->back()->with('success', 'Pedido enviado! Aguarde a confirmação no WhatsApp.');
    }
}