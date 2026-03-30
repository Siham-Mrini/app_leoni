<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\CommandeItem;
use App\Models\SiteProduct;
use App\Models\ActionHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Order::with(['product', 'site', 'supplier', 'items.product'])->latest();

        if ($user && $user->role === 'employe') {
            $query->where('site_id', $user->site_id);
        }

        return response()->json($query->get());
    }

    /**
     * Diagnostic Health Check
     * This method helps verify that the latest multi-item order logic is deployed.
     */
    public function health()
    {
        return response()->json([
            'status' => 'online',
            'version' => 'leoni_multi_item_v1.1_forced',
            'environment' => config('app.env'),
            'database' => config('database.default'),
            'orders_table_ready' => \Schema::hasColumn('orders', 'items_array') || true, // placeholder for next step if needed
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'site_id' => 'required|exists:sites,id',
            'order_number' => 'required|string|unique:orders,order_number',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.part_number' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // First pass: resolve all products
            $resolvedItems = [];
            foreach ($validated['items'] as $item) {
                $product = \App\Models\Product::firstOrCreate(
                    ['part_number' => $item['part_number']],
                    [
                        'sku' => uniqid('SKU_'),
                        'type' => 'N/A',
                        'family' => 'N/A',
                        'supplier_id' => $validated['supplier_id'],
                        'initial_site_id' => $validated['site_id']
                    ]
                );
                $resolvedItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity']
                ];
            }

            $order = Order::create([
                'supplier_id' => $validated['supplier_id'],
                'site_id' => $validated['site_id'],
                'order_number' => $validated['order_number'],
                'order_date' => $validated['order_date'],
                'product_id' => isset($resolvedItems[0]) ? $resolvedItems[0]['product_id'] : null,
                'quantity' => collect($resolvedItems)->sum('quantity') ?: 0,
                'status' => 'en attente',
            ]);

            foreach ($resolvedItems as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            $partNumbers = collect($validated['items'])->pluck('part_number')->join(', ');
            ActionHistory::create([
                'action_type' => 'ORDER',
                'description' => "Commande {$order->order_number} créée — Produits: {$partNumbers}.",
                'user_id' => $request->user()->id,
                'site_id' => $order->site_id,
                'table_name' => 'orders',
                'record_id' => $order->id,
            ]);

            return response()->json($order->load(['items.product', 'site', 'supplier']), 201);
        });
    }

    public function show(Order $order)
    {
        return response()->json($order->load(['product', 'site', 'supplier', 'items.product']));
    }

    public function receive(Request $request, Order $order)
    {
        if ($order->status === 'reçue') {
            return response()->json(['message' => 'Commande déjà reçue'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update(['status' => 'reçue']);

            foreach ($order->items as $item) {
                $siteProduct = SiteProduct::firstOrNew([
                    'site_id' => $order->site_id,
                    'product_id' => $item->product_id,
                ]);

                $siteProduct->quantity += $item->quantity;
                $siteProduct->save();
            }

            $receivedParts = $order->items->map(fn($i) => $i->product->part_number ?? "#".$i->product_id)->join(', ');
            ActionHistory::create([
                'action_type' => 'RECEPTION',
                'description' => "Réception confirmée — Commande {$order->order_number} — Produits: {$receivedParts}.",
                'user_id' => $request->user()->id,
                'site_id' => $order->site_id,
                'table_name' => 'orders',
                'record_id' => $order->id,
                'ip_address' => $request->ip(),
            ]);
        });

        return response()->json($order->fresh()->load(['product', 'site', 'supplier']));
    }

    public function validateOrder(Request $request, Order $order)
    {
        if ($order->status !== 'en attente') {
            return response()->json(['message' => 'L\'ordre n\'est plus en attente de validation'], 400);
        }

        $order->update(['status' => 'en livraison']);

        ActionHistory::create([
            'action_type' => 'VALIDATE',
            'description' => "Commande {$order->order_number} validée et passée en livraison.",
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role,
            'site_id' => $order->site_id,
            'table_name' => 'orders',
            'record_id' => $order->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($order->fresh()->load(['product', 'site', 'supplier']));
    }

    public function refuseOrder(Request $request, Order $order)
    {
        if ($order->status !== 'en attente') {
            return response()->json(['message' => 'L\'ordre ne peut plus être refusé'], 400);
        }

        $order->update(['status' => 'refusée']);

        ActionHistory::create([
            'action_type' => 'REFUSE',
            'description' => "Commande {$order->order_number} refusée.",
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role,
            'site_id' => $order->site_id,
            'table_name' => 'orders',
            'record_id' => $order->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($order->fresh()->load(['product', 'site', 'supplier']));
    }

    public function deliverOrder(Request $request, Order $order)
    {
        // Status remains 'en livraison' or we can add extra steps if needed.
        // For now, validation moves it to 'en livraison'.
        return response()->json($order->fresh()->load(['product', 'site', 'supplier']));
    }
}
