<?php

namespace App\Http\Controllers;

use App\Models\ActionHistory;
use Illuminate\Http\Request;

class ActionHistoryController extends Controller
{
    public function index()
    {
        return response()->json(ActionHistory::with(['user', 'site'])->latest()->get());
    }
}
