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
        $siteId = $request->input('site_id') 
                 ?? $request->input('source_site_id') 
                 ?? $request->input('destination_site_id');
        
        // Specific logic for transfers/transformations: allow if user is either source or destination
        if (!$siteId) {
            $from = $request->input('from_site_id') ?? $request->input('source_site_id');
            $to = $request->input('to_site_id') ?? $request->input('destination_site_id');
            
            if ($from && $to) {
                // If both are present (creating), allow if user is either one
                if ($user->site_id == $from || $user->site_id == $to) {
                    return $next($request);
                }
                $siteId = $from; // Fallback for error message
            } else {
                // For route-model based actions
                $transformation = $request->route('transformation');
                if ($transformation) {
                    if ($user->site_id == $transformation->source_site_id || $user->site_id == $transformation->destination_site_id) {
                        return $next($request);
                    }
                    $siteId = $transformation->source_site_id;
                }
                
                $emplacement = $request->route('emplacement');
                if ($emplacement) {
                    if ($user->site_id == $emplacement->site_id) {
                        return $next($request);
                    }
                    $siteId = $emplacement->site_id;
                }

                $order = $request->route('order');
                $site = $request->route('site');
                
                $siteId = $siteId 
                         ?? ($order ? $order->site_id : null)
                         ?? ($site ? $site->id : null);
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
