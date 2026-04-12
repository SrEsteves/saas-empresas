<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Container\Attributes\Authenticated;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('Categories/Index', [
            'categories' => Category::where('tenant_id', auth()->user()->tenant_id)
                ->orderBy('name')
                ->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        Category::create([
            'name' => $validated['name'],
            'tenant_id' => auth()->user()->tenant_id,
        ]);

        return redirect()->back()->with('success', 'Categoria criada com sucesso!');
    }

    public function destroy(Category $category)
    {
        // Verifica se a categoria pertence ao tenant
        if ($category->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $category->delete();
        return redirect()->back()->with('success', 'Categoria removida!');
    }
}