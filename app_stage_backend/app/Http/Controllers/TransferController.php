<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\SiteProduct;
use App\Models\ActionHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Transfer::with(['product', 'fromSite', 'toSite'])->latest();

        if ($user && $user->role === 'employe') {
            $query->where(function($q) use ($user) {
                $q->where('from_site_id', $user->site_id)
                  ->orWhere('to_site_id', $user->site_id);
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'from_site_id' => 'required|exists:sites,id',
            'to_site_id' => 'required|exists:sites,id|different:from_site_id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        // Permissions: Employee can create PULL (from another site to theirs) or PUSH (from theirs to another site)
        if ($user->role === 'employe') {
            if ($validated['from_site_id'] != $user->site_id && $validated['to_site_id'] != $user->site_id) {
                return response()->json(['message' => 'Vous devez être soit le site source, soit le site de destination.'], 403);
            }
        }

        $validated['status'] = 'demande';
        $validated['transfer_date'] = now();

        $transfer = Transfer::create($validated);

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
        $user = $request->user();

        // Auth: Site source uniquement (+ admin/manager)
        if ($user->role !== 'admin' && $user->role !== 'manager' && (int)$user->site_id !== (int)$transfer->from_site_id) {
            return response()->json(['message' => 'Non autorisé. Seul le site source peut valider le transfert.'], 403);
        }

        if ($transfer->status !== 'demande') {
            return response()->json(['message' => 'Le transfert n\'est pas en attente de validation'], 400);
        }

        return DB::transaction(function () use ($transfer, $request) {
            // Check if from_site has enough available quantity
            $sourceStock = SiteProduct::where('site_id', $transfer->from_site_id)
                ->where('product_id', $transfer->product_id)
                ->lockForUpdate()
                ->first();

            if (!$sourceStock || $sourceStock->quantity < $transfer->quantity) {
                return response()->json(['message' => 'Stock insuffisant dans le site source'], 400);
            }

            // Deduct from source
            $sourceStock->quantity -= $transfer->quantity;
            $sourceStock->save();

            // Add to destination pending stock
            $destStock = SiteProduct::firstOrNew([
                'site_id' => $transfer->to_site_id,
                'product_id' => $transfer->product_id,
            ]);
            $destStock->pending_quantity += $transfer->quantity;
            $destStock->save();

            $transfer->update(['status' => 'en cours']);

            ActionHistory::create([
                'action_type' => 'TRANSFER_VALIDATED',
                'description' => "Transfert #{$transfer->id} validé par {$transfer->fromSite->name}. En transit.",
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'user_role' => $request->user()->role,
                'site_id' => $transfer->from_site_id,
                'table_name' => 'transfers',
                'record_id' => $transfer->id,
                'ip_address' => $request->ip(),
            ]);

            return response()->json($transfer->load(['product', 'fromSite', 'toSite']));
        });
    }

    public function show(Transfer $transfer)
    {
        return response()->json($transfer->load(['product', 'fromSite', 'toSite']));
    }

    public function complete(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Auth: Site source OU destination peuvent confirmer la réception (+ admin/manager)
        $isSource = (int)$user->site_id === (int)$transfer->from_site_id;
        $isDest   = (int)$user->site_id === (int)$transfer->to_site_id;
        if ($user->role !== 'admin' && $user->role !== 'manager' && !$isSource && !$isDest) {
            return response()->json(['message' => 'Non autorisé. Seul le site source ou destination peut confirmer la réception.'], 403);
        }

        if ($transfer->status !== 'en cours') {
            return response()->json(['message' => 'Le transfert n\'est pas en cours'], 400);
        }

        DB::transaction(function () use ($transfer, $request) {
            $transfer->update([
                'status' => 'reçu',
                'transfer_date' => now()
            ]);

            // Move from pending to quantity in destination site
            $destStock = SiteProduct::firstOrNew([
                'site_id' => $transfer->to_site_id,
                'product_id' => $transfer->product_id,
            ]);

            // Initialize fields to 0 for new records
            if (!$destStock->exists) {
                $destStock->quantity = 0;
                $destStock->pending_quantity = 0;
                $destStock->installed_quantity = 0;
            }

            $destStock->pending_quantity = max(0, ($destStock->pending_quantity ?? 0) - $transfer->quantity);
            $destStock->quantity = ($destStock->quantity ?? 0) + $transfer->quantity;
            $destStock->save();

            ActionHistory::create([
                'action_type' => 'TRANSFER_COMPLETED',
                'description' => "Transfert de {$transfer->quantity} unité(s) de produit [{$transfer->product->part_number}] reçu par {$transfer->toSite->name}.",
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'user_role' => $request->user()->role,
                'site_id' => $transfer->to_site_id,
                'table_name' => 'transfers',
                'record_id' => $transfer->id,
                'ip_address' => $request->ip(),
            ]);
        });

        return response()->json($transfer->fresh()->load(['product', 'fromSite', 'toSite']));
    }

    public function refuse(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Source can refuse a 'demande'
        // Destination can refuse an 'en cours' (reception)
        if ($transfer->status === 'demande') {
            // Seul le site source peut refuser une demande
            if ($user->role !== 'admin' && $user->role !== 'manager' && (int)$user->site_id !== (int)$transfer->from_site_id) {
                return response()->json(['message' => 'Non autorisé. Seul le site source peut refuser la demande.'], 403);
            }
        }
        elseif ($transfer->status === 'en cours') {
            // Source OU destination peuvent refuser la réception
            $isSource = (int)$user->site_id === (int)$transfer->from_site_id;
            $isDest   = (int)$user->site_id === (int)$transfer->to_site_id;
            if ($user->role !== 'admin' && $user->role !== 'manager' && !$isSource && !$isDest) {
                return response()->json(['message' => 'Non autorisé.'], 403);
            }
        }
        else {
            return response()->json(['message' => 'Le transfert ne peut pas être refusé dans cet état.'], 400);
        }

        DB::transaction(function () use ($transfer, $request) {
            $oldStatus = $transfer->status;
            $transfer->update(['status' => 'refusé']);

            if ($oldStatus === 'en cours') {
                // Return stock to source site
                $sourceStock = SiteProduct::where('site_id', $transfer->from_site_id)
                    ->where('product_id', $transfer->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($sourceStock) {
                    $sourceStock->quantity += $transfer->quantity;
                    $sourceStock->save();
                }

                // Remove from pending at destination
                $destStock = SiteProduct::where('site_id', $transfer->to_site_id)
                    ->where('product_id', $transfer->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($destStock) {
                    $destStock->pending_quantity -= $transfer->quantity;
                    $destStock->save();
                }
            }

            ActionHistory::create([
                'action_type' => 'TRANSFER_REFUSED',
                'description' => "Transfert #{$transfer->id} refusé (État précédent: {$oldStatus}).",
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'user_role' => $request->user()->role,
                'site_id' => $request->user()->site_id,
                'table_name' => 'transfers',
                'record_id' => $transfer->id,
                'ip_address' => $request->ip(),
            ]);
        });

        return response()->json($transfer);
    }

    public function cancel(Request $request, Transfer $transfer)
    {
        $user = $request->user();

        // Can cancel if 'demande' or 'en cours'
        // If 'demande', requester can cancel.
        // If 'en cours', source site or admin can cancel (as per user rules).
        if ($transfer->status === 'demande') {
        // No stock changes yet, just cancel
        }
        elseif ($transfer->status === 'en cours') {
            // Seul le site source peut annuler une expédition en cours
            if ($user->role !== 'admin' && $user->role !== 'manager' && (int)$user->site_id !== (int)$transfer->from_site_id) {
                return response()->json(['message' => 'Non autorisé. Seul le site source peut annuler le transfert en cours.'], 403);
            }
        }
        else {
            return response()->json(['message' => 'Le transfert ne peut pas être annulé.'], 400);
        }

        DB::transaction(function () use ($transfer, $request) {
            $oldStatus = $transfer->status;
            $transfer->update(['status' => 'annulé']);

            if ($oldStatus === 'en cours') {
                // Return stock to source site
                $sourceStock = SiteProduct::where('site_id', $transfer->from_site_id)
                    ->where('product_id', $transfer->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($sourceStock) {
                    $sourceStock->quantity += $transfer->quantity;
                    $sourceStock->save();
                }

                // Remove from pending at destination
                $destStock = SiteProduct::where('site_id', $transfer->to_site_id)
                    ->where('product_id', $transfer->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($destStock) {
                    $destStock->pending_quantity -= $transfer->quantity;
                    $destStock->save();
                }
            }

            ActionHistory::create([
                'action_type' => 'TRANSFER_CANCELED',
                'description' => "Transfert #{$transfer->id} annulé.",
                'user_id' => $request->user()->id,
                'user_name' => $request->user()->name,
                'user_role' => $request->user()->role,
                'site_id' => $request->user()->site_id,
                'table_name' => 'transfers',
                'record_id' => $transfer->id,
                'ip_address' => $request->ip(),
            ]);
        });

        return response()->json($transfer);
    }

    public function destroy(Request $request, Transfer $transfer)
    {
        ActionHistory::create([
            'action_type' => 'TRANSFER_DELETED',
            'description' => "Transfert #{$transfer->id} supprimé par l'administrateur.",
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_role' => $request->user()->role,
            'site_id' => $transfer->from_site_id,
            'table_name' => 'transfers',
            'record_id' => $transfer->id,
            'ip_address' => $request->ip(),
        ]);

        $transfer->delete();
        return response()->json(null, 204);
    }
}
