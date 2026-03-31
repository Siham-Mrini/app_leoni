<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Product::with(['sites', 'initialSite', 'supplier', 'emplacement'])->latest();
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
            'initial_site_id' => 'required|exists:sites,id',
            'initial_quantity' => 'required|integer|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'emplacement_id' => 'required|exists:emplacements,id',
        ]);

        $user = $request->user();
        $targetSiteId = ($user->role === 'employe') ? $user->site_id : $request->input('initial_site_id');

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
                'site_id' => $targetSiteId,
                'table_name' => 'products',
                'record_id' => $product->id,
            ]);

            return response()->json($product->load(['sites', 'initialSite', 'supplier', 'emplacement']), 201);
        }

        $product = Product::create([
            'part_number' => $validated['part_number'],
            'sku' => $validated['sku'] ?? null,
            'type' => $validated['type'],
            'family' => $validated['family'],
            'price' => $validated['price'] ?? 0,
            'image_url' => $validated['image_url'] ?? null,
            'initial_site_id' => $targetSiteId,
            'supplier_id' => $validated['supplier_id'] ?? null,
            'is_installed' => false,
            'emplacement_id' => $validated['emplacement_id'],
        ]);

        if ($validated['initial_quantity'] >= 0) {
            $product->sites()->attach($targetSiteId, [
                'quantity' => $validated['initial_quantity'],
                'installed_quantity' => 0,
            ]);
        }

        \App\Models\ActionHistory::create([
            'action_type' => 'CREATE',
            'description' => "Création du produit [{$product->part_number}].",
            'user_id' => $user->id ?? 1,
            'site_id' => $targetSiteId,
            'table_name' => 'products',
            'record_id' => $product->id,
        ]);

        return response()->json($product->load(['sites', 'initialSite', 'supplier', 'emplacement']), 201);
    }

    public function show(Product $product)
    {
        return response()->json($product->load(['sites', 'initialSite', 'supplier', 'emplacement']));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'part_number' => 'sometimes|required|string|unique:products,part_number,' . $product->id,
            'sku' => 'nullable|string',
            'type' => 'sometimes|required|string',
            'family' => 'sometimes|required|string',
            'price' => 'nullable|numeric',
            'image_url' => 'nullable|string',
            'is_installed' => 'sometimes|boolean',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'emplacement_id' => 'nullable|exists:emplacements,id',
            'initial_quantity' => 'nullable|integer|min:0',
        ]);

        $user = $request->user();
        if ($user->role !== 'admin' && $product->initial_site_id && (int)$user->site_id !== (int)$product->initial_site_id) {
            return response()->json(['message' => 'Non autorisé à modifier ce produit.'], 403);
        }

        $product->fill($validated)->save();

        if ($request->has('initial_quantity')) {
            $user = $request->user();
            $targetSiteId = ($user->role === 'employe') ? $user->site_id : ($request->input('site_id') ?: $product->initial_site_id);
            if ($targetSiteId) {
                $siteProduct = $product->sites()->where('site_id', $targetSiteId)->first();
                if ($siteProduct) {
                    $siteProduct->pivot->quantity = $validated['initial_quantity'];
                    $siteProduct->pivot->save();
                } else {
                    $product->sites()->attach($targetSiteId, [
                        'quantity' => $validated['initial_quantity'],
                        'installed_quantity' => 0,
                    ]);
                }
            }
        }

        \App\Models\ActionHistory::create([
            'action_type' => 'UPDATE',
            'description' => "Modification du produit [{$product->part_number}].",
            'user_id' => $request->user()->id ?? 1,
            'site_id' => $product->initial_site_id,
            'table_name' => 'products',
            'record_id' => $product->id,
        ]);

        return response()->json($product->load(['sites', 'initialSite', 'supplier', 'emplacement']));
    }

    public function destroy(Product $product, Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin' && $product->initial_site_id && (int)$user->site_id !== (int)$product->initial_site_id) {
            // Check if the site still exists before blocking
            if (\App\Models\Site::find($product->initial_site_id)) {
                return response()->json(['message' => 'Non autorisé à supprimer ce produit.'], 403);
            }
        }

        \App\Models\ActionHistory::create([
            'action_type' => 'DELETE',
            'description' => "Suppression du produit [{$product->part_number}].",
            'user_id' => $request->user()->id ?? 1,
            'site_id' => $product->initial_site_id,
            'table_name' => 'products',
            'record_id' => $product->id,
        ]);

        // Detach from all sites (pivot table cleanup)
        $product->sites()->detach();
        $product->delete();
        return response()->json(null, 204);
    }
}
