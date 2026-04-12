<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use Inertia\Inertia;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('Products/Index', [
            'products' => Product::with('category')->orderBy('name')->get(),
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'category_id'   => 'nullable|exists:categories,id',
            'sku'           => 'nullable|string|max:50',
            'cost_price'    => 'required|numeric|min:0',
            'sale_price'    => 'required|numeric|min:0',
            'minimum_stock' => 'required|integer|min:0'
        ]);

        $validated['tenant_id'] = auth()->user()->tenant_id;

        Product::create($validated);

        return redirect()->back()->with('success', 'Produto criado com sucesso!');
    }

    public function adjustStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'quantity'  => 'required|integer|min:1',
            'type'      => 'required|in:in,out',
            'reason'    => 'required|string|max:255',
        ]);

        DB::transaction(function() use ($validated, $product) {
            //Registra no histórico
            StockMovement::create([
                'tenant_id'     => $product->tenant_id,
                'product_id'    => $product->id,
                'quantity'      => $validated['type'] === 'in' ? $validated['quantity'] : -$validated['quantity'],
                'type'          => $validated['type'],
                'reason'        => $validated['reason'],
            ]);

            //Atualiza o saldo no produto

            if ($validated['type'] === 'in') {
                $product->increment('current_stock', $validated['quantity']);
            } else {
                $product->decrement('current_stock', $validated['quantity']);
            }
        });

        return redirect()->back()->with('success', 'Estoque atualizado!');
    }
}
