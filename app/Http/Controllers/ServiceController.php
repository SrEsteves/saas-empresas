<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Service;
use App\Models\Product;
use Inertia\Inertia;

class ServiceController extends Controller
{
    public function index()
    {
        // Retorna todos os serviços, do mais novo pro mais velho
        $services = Service::latest()->get();

        return Inertia::render('Services/Index', [
            'services' => $services,
            'products' => Product::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'consumed_products' => 'nullable|array',
            'consumed_products.*.id' => 'required|exists:products,id',
            'consumed_products.*.quantity' => 'required|numeric|min:0.01'
        ]);

        $validated['is_active'] = true; // Todo serviço novo nasce ativo

        $service = Service::create($validated);

        if (!empty($request->consumed_products)) {
            $syncData = [];
            foreach ($request->consumed_products as $item) {
                $syncData[$item['id']] = ['quantity' => $item['quantity']];
            }
            $service->products()->sync($syncData);
        }

        return redirect()->back()->with('success', 'Serviço criado com sucesso!');
    }

    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'consumed_products' => 'nullable|array',
            'consumed_products.*.id' => 'required|exists:products,id',
            'consumed_products.*.quantity' => 'required|numeric|min:0.01',
        ]);

        $service->update($validated);

        // Atualiza a receita no banco
        if (isset($validated['consumed_products'])) {
            $syncData = [];
            foreach ($validated['consumed_products'] as $item) {
                $syncData[$item['id']] = ['quantity' => $item['quantity']];
            }
            $service->products()->sync($syncData);
        } else {
            // Se ele apagar todos os produtos da lista, limpamos o banco também
            $service->products()->detach(); 
        }

        return redirect()->back()->with('success', 'Serviço e receita atualizados!');
    }

    public function destroy(Service $service)
    {
        // Ao invés de apagar (delete), nós apenas inativamos!
        $service->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Serviço inativado e oculto da tela de agendamento!');
    }
}