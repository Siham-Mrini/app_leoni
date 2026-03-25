<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Product::with(['sites', 'initialSite', 'supplier'])->latest();
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'part_number' => 'required|string',
            'sku' => 'nullable|string',
            'type' => 'required|string',
            'family' => 'required|string',
            'price' => 'nullable|numeric',
            'image_url' => 'nullable|string',
            'site_id' => 'required|exists:sites,id',
            'initial_quantity' => 'required|integer|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $user = $request->user();
        if ($user->role === 'employe') {
            $validated['site_id'] = $user->site_id;
        }

        $existingProduct = Product::where('part_number', $validated['part_number'])->first();

        if ($existingProduct) {
            $product = $existingProduct;
            if ($validated['initial_quantity'] >= 0) {
                // Check if site is already attached
                $siteProduct = $product->sites()->where('site_id', $validated['site_id'])->first();
                if ($siteProduct) {
                    $siteProduct->pivot->quantity += $validated['initial_quantity'];
                    $siteProduct->pivot->save();
                } else {
                    $product->sites()->attach($validated['site_id'], [
                        'quantity' => $validated['initial_quantity'],
                        'installed_quantity' => 0,
                    ]);
                }
            }
            
            \App\Models\ActionHistory::create([
                'action_type' => 'UPDATE',
                'description' => "Ajout de stock / liaison pour le produit existant [{$product->part_number}].",
                'user_id' => $user->id ?? 1,
                'site_id' => $validated['site_id'],
                'table_name' => 'products',
                'record_id' => $product->id,
            ]);

            return response()->json($product->load(['sites', 'initialSite', 'supplier']), 201);
        }

        $product = Product::create([
            'part_number' => $validated['part_number'],
            'sku' => $validated['sku'] ?? null,
            'type' => $validated['type'],
            'family' => $validated['family'],
            'price' => $validated['price'] ?? 0,
            'image_url' => $validated['image_url'] ?? null,
            'initial_site_id' => $validated['site_id'],
            'supplier_id' => $validated['supplier_id'] ?? null,
            'is_installed' => false,
        ]);

        if ($validated['initial_quantity'] >= 0) {
            $product->sites()->attach($validated['site_id'], [
                'quantity' => $validated['initial_quantity'],
                'installed_quantity' => 0,
            ]);
        }

        \App\Models\ActionHistory::create([
            'action_type' => 'CREATE',
            'description' => "Création du produit [{$product->part_number}].",
            'user_id' => $user->id ?? 1,
            'site_id' => $validated['site_id'],
            'table_name' => 'products',
            'record_id' => $product->id,
        ]);

        return response()->json($product->load(['sites', 'initialSite', 'supplier']), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['sites', 'initialSite', 'supplier']));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'part_number' => 'required|string|unique:products,part_number,' . $product->id,
            'sku' => 'nullable|string',
            'type' => 'required|string',
            'family' => 'required|string',
            'price' => 'nullable|numeric',
            'image_url' => 'nullable|string',
            'is_installed' => 'boolean',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $product->update($validated);

        \App\Models\ActionHistory::create([
            'action_type' => 'UPDATE',
            'description' => "Modification du produit [{$product->part_number}].",
            'user_id' => $request->user()->id ?? 1,
            'site_id' => $product->initial_site_id,
            'table_name' => 'products',
            'record_id' => $product->id,
        ]);

        return response()->json($product->load(['sites', 'initialSite', 'supplier']));
    }

    public function destroy(Product $product, Request $request)
    {
        \App\Models\ActionHistory::create([
            'action_type' => 'DELETE',
            'description' => "Suppression du produit [{$product->part_number}].",
            'user_id' => $request->user()->id ?? 1,
            'site_id' => $product->initial_site_id,
            'table_name' => 'products',
            'record_id' => $product->id,
        ]);

        $product->delete();
        return response()->json(null, 204);
    }
}
