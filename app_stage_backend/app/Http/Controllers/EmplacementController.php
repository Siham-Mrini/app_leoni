<?php

namespace App\Http\Controllers;

use App\Models\Emplacement;
use Illuminate\Http\Request;

class EmplacementController extends Controller
{
    public function index(Request $request)
    {
        $query = Emplacement::with(['site', 'products.sites']);
        
        if ($request->has('site_id')) {
            $query->where('site_id', $request->site_id);
        }
        
        if ($request->has('code')) {
            $query->where('code', 'like', '%' . $request->code . '%');
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:emplacements,code',
            'site_id' => 'required|exists:sites,id',
        ]);

        $emplacement = Emplacement::create($validated);
        return response()->json($emplacement, 201);
    }

    public function show(Emplacement $emplacement)
    {
        return response()->json($emplacement->load('site'));
    }

    public function update(Request $request, Emplacement $emplacement)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:emplacements,code,' . $emplacement->id,
            'site_id' => 'required|exists:sites,id',
        ]);

        $emplacement->update($validated);
        return response()->json($emplacement);
    }

    public function destroy(Emplacement $emplacement)
    {
        $emplacement->delete();
        return response()->json(null, 204);
    }
}
