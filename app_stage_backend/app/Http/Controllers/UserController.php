<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\User::with('site')->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,employe,fournisseur',
            'site_id' => 'nullable|exists:sites,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);

        $user = \App\Models\User::create($validated);

        return response()->json($user->load('site'), 201);
    }

    public function show(\App\Models\User $user)
    {
        return response()->json($user->load('site'));
    }

    public function update(Request $request, \App\Models\User $user)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'prenom' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'sometimes|required|in:admin,employe,fournisseur',
            'site_id' => 'nullable|exists:sites,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        }
        else {
            unset($validated['password']);
        }

        $user->update($validated);
        return response()->json($user->load('site'));
    }

    public function destroy(\App\Models\User $user)
    {
        $user->delete();
        return response()->json(null, 204);
    }
}
