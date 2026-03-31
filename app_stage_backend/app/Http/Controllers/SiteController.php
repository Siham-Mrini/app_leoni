<?php

namespace App\Http\Controllers;

use App\Models\Site;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function index()
    {
        return response()->json(Site::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        $Site = Site::create($validated);
        return response()->json($Site, 201);
    }

    public function show(Site $Site)
    {
        // Load the stock information for this Site
        return response()->json($Site->load('products'));
    }

    public function update(Request $request, Site $Site)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        $Site->update($validated);
        return response()->json($Site);
    }

    public function destroy(Site $Site)
    {
        // Detach all products from this site's pivot table
        $Site->products()->detach();

        // Null out initial_site_id for products originating from this site
        \App\Models\Product::where('initial_site_id', $Site->id)
            ->update(['initial_site_id' => null]);

        // Delete emplacements (cascade from migration, but just to be safe)
        $Site->emplacements()->delete();

        $Site->delete();
        return response()->json(null, 204);
    }
}
