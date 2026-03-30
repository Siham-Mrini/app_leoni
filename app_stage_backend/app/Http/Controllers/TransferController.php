<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\SiteProduct;
use App\Models\ActionHistory;
use App\Models\TransferLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TransferController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Transfer::class);
        
        $query = Transfer::with([
            'product', 'fromSite', 'toSite', 
            'validatedBy', 'deliveredBy', 'receivedBy',
            'logs.user'
        ])->latest();

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $this->authorize('create', Transfer::class);
        
        $user = $request->user();
        $validated = $request->validate([
            'from_site_id' => 'required|exists:sites,id',
            'to_site_id' => 'required|exists:sites,id|different:from_site_id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($user->role === 'employe') {
            if ($validated['from_site_id'] != $user->site_id && $validated['to_site_id'] != $user->site_id) {
                return response()->json(['message' => 'Vous devez être soit le site source, soit le site de destination.'], 403);
            }
        }

        $validated['status'] = 'en_attente';
        $validated['transfer_date'] = now();

        $transfer = Transfer::create($validated);

        TransferLog::create([
            'transfer_id' => $transfer->id,
            'action' => 'créé',
            'user_id' => $user->id,
        ]);

        // Optionnel : garder l'ancien ActionHistory pour la compatibilité avec le reste de l'app si nécessaire
        ActionHistory::create([
            'action_type' => 'TRANSFER_REQUEST',
            'description' => "Demande de transfert de {$transfer->quantity} unité(s) de produit [{$transfer->product->part_number}] créée depuis {$transfer->fromSite->name} vers {$transfer->toSite->name}.",
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->role,
            'site_id' => $user->site_id,
            'table_name' => 'transfers',
            'record_id' => $transfer->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($transfer->load(['product', 'fromSite', 'toSite']), 201);
    }

    public function validateTransfer(Request $request, Transfer $transfer)
    {
        $this->authorize('validate', $transfer);

        if ($transfer->status !== 'en_attente') {
            return response()->json(['message' => 'Le transfert n\'est pas en attente de validation'], 400);
        }

        // Check if from_site has enough available quantity before validating
        $sourceStock = SiteProduct::where('site_id', $transfer->from_site_id)
            ->where('product_id', $transfer->product_id)
            ->first();

        if (!$sourceStock || $sourceStock->quantity < $transfer->quantity) {
            return response()->json(['message' => 'Stock insuffisant dans le site source'], 400);
        }

        $transfer->update([
            'status' => 'validé',
            'validated_by' => $request->user()->id,
            'validated_at' => now(),
        ]);
        
        TransferLog::create([
            'transfer_id' => $transfer->id,
            'action' => 'validé',
            'user_id' => $request->user()->id,
        ]);

        return response()->json($transfer->fresh()->load(['product', 'fromSite', 'toSite', 'validatedBy', 'logs.user']));
    }
    
    public function markAsDelivered(Request $request, Transfer $transfer)
    {
        $this->authorize('deliver', $transfer);

        if ($transfer->status !== 'validé') {
            return response()->json(['message' => 'Le transfert doit être validé d\'abord.'], 400);
        }

        return DB::transaction(function () use ($transfer, $request) {
            // Deduct from source directly
            $sourceStock = SiteProduct::where('site_id', $transfer->from_site_id)
                ->where('product_id', $transfer->product_id)
                ->lockForUpdate()
                ->first();

            if (!$sourceStock || $sourceStock->quantity < $transfer->quantity) {
                return response()->json(['message' => 'Stock insuffisant dans le site source lors de l\'expédition'], 400);
            }

            $sourceStock->quantity -= $transfer->quantity;
            $sourceStock->save();
            
            // Add to destination pending stock
            $destStock = SiteProduct::firstOrNew([
                'site_id' => $transfer->to_site_id,
                'product_id' => $transfer->product_id,
            ]);
            $destStock->pending_quantity += $transfer->quantity;
            $destStock->save();

            $transfer->update([
                'status' => 'en_livraison',
                'delivered_by' => $request->user()->id,
                'delivered_at' => now(),
            ]);
            
            TransferLog::create([
                'transfer_id' => $transfer->id,
                'action' => 'en_livraison',
                'user_id' => $request->user()->id,
            ]);

            return response()->json($transfer->fresh()->load(['product', 'fromSite', 'toSite', 'deliveredBy', 'logs.user']));
        });
    }

    public function markAsReceived(Request $request, Transfer $transfer)
    {
        $this->authorize('receive', $transfer);

        if ($transfer->status !== 'en_livraison') {
            return response()->json(['message' => 'Le transfert doit être en livraison d\'abord.'], 400);
        }

        return DB::transaction(function () use ($transfer, $request) {
            $transfer->update([
                'status' => 'reçu',
                'received_by' => $request->user()->id,
                'received_at' => now(),
                'transfer_date' => now()
            ]);

            // Move from pending to quantity in destination site
            $destStock = SiteProduct::firstOrNew([
                'site_id' => $transfer->to_site_id,
                'product_id' => $transfer->product_id,
            ]);

            if (!$destStock->exists) {
                $destStock->quantity = 0;
                $destStock->pending_quantity = 0;
                $destStock->installed_quantity = 0;
            }

            $destStock->pending_quantity = max(0, ($destStock->pending_quantity ?? 0) - $transfer->quantity);
            $destStock->quantity = ($destStock->quantity ?? 0) + $transfer->quantity;
            $destStock->save();

            TransferLog::create([
                'transfer_id' => $transfer->id,
                'action' => 'reçu',
                'user_id' => $request->user()->id,
            ]);

            return response()->json($transfer->fresh()->load(['product', 'fromSite', 'toSite', 'receivedBy', 'logs.user']));
        });
    }

    public function show(Transfer $transfer)
    {
        $this->authorize('view', $transfer);
        return response()->json($transfer->load([
            'product', 'fromSite', 'toSite', 
            'validatedBy', 'deliveredBy', 'receivedBy',
            'logs.user'
        ]));
    }
}
