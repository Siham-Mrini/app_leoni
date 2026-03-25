<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class CheckSite
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || $user->role === 'admin' || $request->isMethod('GET')) {
            return $next($request);
        }

        // site ID from request or route
        $siteId = $request->input('site_id');
        
        // Specific logic for transfers: allow if user is either source or destination
        if (!$siteId) {
            $from = $request->input('from_site_id');
            $to = $request->input('to_site_id');
            
            if ($from && $to) {
                // If both are present (creating), allow if user is either one
                if ($user->site_id == $from || $user->site_id == $to) {
                    return $next($request);
                }
                $siteId = $from; // Fallback for error message
            } else {
                // For route-model based actions (validate, complete, refuse, cancel)
                // check if the user's site participates as source OR destination
                $transfer = $request->route('transfer');
                if ($transfer) {
                    if ($user->site_id == $transfer->from_site_id || $user->site_id == $transfer->to_site_id) {
                        return $next($request);
                    }
                    $siteId = $transfer->from_site_id; // Fallback for error message
                } else {
                    $siteId = $from ?? $to
                             ?? ($request->route('order') ? $request->route('order')->site_id : null)
                             ?? ($request->route('site') ? $request->route('site')->id : null);
                }
            }
        }

        if ($siteId && $user->site_id && (string)$user->site_id !== (string)$siteId) {
            Log::warning('Checksite blocked request', [
                'user_id' => $user->id,
                'user_site' => $user->site_id,
                'requested_site' => $siteId,
                'url' => $request->fullUrl(),
                'method' => $request->method()
            ]);
            return response()->json([
                'message' => 'Unauthorized: You can only perform actions in your own site.',
                'user_site' => $user->site_id,
                'requested_site' => $siteId
            ], 403);
        }

        return $next($request);
    }
}
