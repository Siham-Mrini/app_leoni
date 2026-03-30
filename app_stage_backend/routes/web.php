<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrderController;

Route::get('/', function () {
    return view('welcome');
});

// Root-level diagnostics for troubleshooting (signature v2.1)
Route::get('health', [OrderController::class, 'health']);
Route::get('check-db', [OrderController::class, 'checkDb']);
