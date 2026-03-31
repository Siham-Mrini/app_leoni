<?php

namespace App\Http\Controllers;

use App\Models\SiteProduct;
use App\Models\ActionHistory;
use Illuminate\Http\Request;

class InstallationController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $query = SiteProduct::with(['site', 'product']);

        if ($user && $user->role === 'employe') {
            $query->where('site_id', $user->site_id);
        }

        $stats = $query->get()
            ->groupBy('site_id')
            ->map(function ($items) {
            return [
            'site_name' => $items->first()->site->name,
            'types' => $items->map(function ($item) {
                    return [
                    'reference' => $item->product->part_number,
                    'family' => $item->product->family,
                    'type' => $item->product->type,
                    'installed' => $item->installed_quantity,
                    'non_installed' => $item->quantity,
                    ];
                }
                )
                ];
            });

        return response()->json($stats);
    }

    public function install(Request $request)
    {
        $validated = $request->validate([
            'site_id'    => 'required|exists:sites,id',
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|integer|min:1',
            'mode'       => 'nullable|in:install,uninstall',
        ]);

        $mode = $validated['mode'] ?? 'install';

        $stock = SiteProduct::where('site_id', $validated['site_id'])
            ->where('product_id', $validated['product_id'])
            ->first();

        if (!$stock) {
            return response()->json(['message' => 'Produit non trouvé dans ce site'], 404);
        }

        $product = \App\Models\Product::find($validated['product_id']);
        $site    = \App\Models\Site::find($validated['site_id']);

        if ($mode === 'uninstall') {
            // Remove from installed → put back in available stock
            if ($validated['quantity'] > $stock->installed_quantity) {
                return response()->json(['message' => 'La quantité à retirer dépasse le nombre installé'], 400);
            }

            $stock->installed_quantity -= $validated['quantity'];
            $stock->quantity           += $validated['quantity'];
            $stock->save();

            ActionHistory::create([
                'action_type' => 'DESINSTALLATION',
                'description' => "Retrait de {$validated['quantity']} unité(s) de [{$product->part_number}] sur le site [{$site->name}] le " . now()->format('d/m/Y à H:i') . ".",
                'user_id'     => $request->user()->id,
                'site_id'     => $validated['site_id'],
            ]);

            return response()->json([
                'message' => 'Retrait enregistré avec succès',
                'data'    => $stock
            ]);
        }

        // Default: install mode — move from available to installed
        if ($validated['quantity'] > $stock->quantity) {
            return response()->json(['message' => 'La quantité à installer dépasse le stock disponible'], 400);
        }

        $stock->quantity           -= $validated['quantity'];
        $stock->installed_quantity += $validated['quantity'];
        $stock->save();

        ActionHistory::create([
            'action_type' => 'INSTALLATION',
            'description' => "Installation de {$validated['quantity']} unité(s) de [{$product->part_number}] sur le site [{$site->name}] le " . now()->format('d/m/Y à H:i') . ".",
            'user_id'     => $request->user()->id,
            'site_id'     => $validated['site_id'],
        ]);

        return response()->json([
            'message' => 'Installation enregistrée avec succès',
            'data'    => $stock
        ]);
    }
}
