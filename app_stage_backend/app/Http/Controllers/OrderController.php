<?php

namespace App\Http\Controllers;

use App\Models\Order;
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
        $query = Order::with(['product', 'site', 'supplier'])->latest();

        if ($user && $user->role === 'employe') {
            $query->where('site_id', $user->site_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'site_id' => 'required|exists:sites,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'order_number' => 'required|string|unique:orders,order_number',
            'order_date' => 'required|date',
        ]);

        // 1. Check if product is already in the target site
        $localStock = SiteProduct::where('site_id', $validated['site_id'])
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($localStock && $localStock->quantity > 0) {
            return response()->json([
                'message' => "Le produit est déjà disponible en stock sur ce site ({$localStock->quantity} unités).",
                'type' => 'error_in_stock'
            ], 400);
        }

        // 2. Check if product is available in other sites (Suggest Transfer)
        $otherSitesStock = SiteProduct::where('site_id', '!=', $validated['site_id'])
            ->where('product_id', $validated['product_id'])
            ->where('quantity', '>', 0)
            ->with('site')
            ->get();

        if ($otherSitesStock->isNotEmpty() && !$request->has('force_order')) {
            return response()->json([
                'message' => "Ce produit est disponible dans d'autres sites. Nous recommandons un transfert.",
                'type' => 'transfer_suggestion',
                'available_sites' => $otherSitesStock->map(function ($s) {
                return [
                        'site_id' => $s->site_id,
                        'site_name' => $s->site->name,
                        'quantity' => $s->quantity
                    ];
            })
            ], 200); // 200 because it's a suggestion, frontend will handle the modal
        }

        $validated['status'] = 'en attente';

        $order = Order::create($validated);


        ActionHistory::create([
            'action_type' => 'ORDER',
            'description' => "Commande {$order->order_number} de {$order->quantity} unité(s) de [{$order->product->part_number}] passée auprès de {$order->supplier->name}.",
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role,
            'site_id' => $order->site_id,
            'table_name' => 'orders',
            'record_id' => $order->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($order->load(['product', 'site', 'supplier']), 201);
    }

    public function show(Order $order)
    {
        return response()->json($order->load(['product', 'site', 'supplier']));
    }

    public function receive(Request $request, Order $order)
    {
        if ($order->status === 'reçue') {
            return response()->json(['message' => 'Commande déjà reçue'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update(['status' => 'reçue']);

            $siteProduct = SiteProduct::firstOrNew([
                'site_id' => $order->site_id,
                'product_id' => $order->product_id,
            ]);

            $siteProduct->quantity += $order->quantity;
            $siteProduct->save();

            ActionHistory::create([
                'action_type' => 'RECEPTION',
                'description' => "Réception confirmée de {$order->quantity} unité(s) de [{$order->product->part_number}] pour la commande {$order->order_number}.",
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'user_role' => $request->user()->role,
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
