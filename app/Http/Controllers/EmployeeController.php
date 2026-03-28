<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        $tenant = auth()->user()->tenant;
        
        // Traz os profissionais junto com a lista de serviços que eles fazem
        $employees = Employee::with('services')
            ->where('tenant_id', $tenant->id)
            ->get();
            
        // Traz todos os serviços da empresa para montar as "caixinhas de marcar" (checkbox)
        $services = Service::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'services' => $services
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'service_ids' => 'required|array|min:1', // Exige pelo menos 1 serviço
            'service_ids.*' => 'exists:services,id'
        ]);

        $tenant = auth()->user()->tenant;

        $employee = Employee::create([
            'tenant_id' => $tenant->id,
            'name' => $request->name,
            'is_active' => true,
        ]);

        // AQUI ESTÁ A MÁGICA: Salva a relação na tabela employee_service
        $employee->services()->attach($request->service_ids);

        return redirect()->back();
    }

    public function destroy(Employee $employee)
    {
        // Garante que só deleta se for da própria empresa
        if ($employee->tenant_id === auth()->user()->tenant_id) {
            $employee->delete();
        }
        return redirect()->back();
    }
}