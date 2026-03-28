<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Service;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index()
    {
        // Retorna todos os serviços, do mais novo pro mais velho
        $services = Service::latest()->get();

        return Inertia::render('Services/Index', [
            'services' => $services
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
        ]);

        $validated['is_active'] = true; // Todo serviço novo nasce ativo

        Service::create($validated);

        return redirect()->back()->with('success', 'Serviço criado com sucesso!');
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $service->update($validated);

        return redirect()->back()->with('success', 'Serviço atualizado!');
    }

    public function destroy(Service $service)
    {
        // Ao invés de apagar (delete), nós apenas inativamos!
        $service->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Serviço inativado e oculto da tela de agendamento!');
    }
}