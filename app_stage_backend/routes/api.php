<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\InstallationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActionHistoryController;

Route::get('/test-db', function() {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $admin = \App\Models\User::where('email', 'admin@leoni.com')->first();
        return response()->json([
            'database' => 'connected',
            'admin_exists' => $admin ? 'yes' : 'no',
            'user_count' => \App\Models\User::count(),
            'app_key_set' => !empty(config('app.key')),
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

Route::post('login', [AuthController::class , 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [AuthController::class , 'me']);
    Route::put('me', [AuthController::class , 'updateProfile']);
    Route::put('me/password', [AuthController::class , 'updatePassword']);
    Route::post('logout', [AuthController::class , 'logout']);

    // Admin Only
    Route::middleware('role:admin')->group(function () {
            Route::post('register', [AuthController::class , 'register']);
            Route::apiResource('users', \App\Http\Controllers\UserController::class);
            Route::get('dashboard/stats', [DashboardController::class , 'stats']);
        }
        );

        // Internal Roles (Employé & Admin)
        Route::middleware('role:admin,employe')->group(function () {
            Route::apiResource('sites', SiteController::class)->except(['index', 'show']);
            Route::get('histories', [ActionHistoryController::class , 'index']);
            Route::apiResource('suppliers', SupplierController::class)->except(['index', 'show']);
            Route::middleware('site')->group(function () {
                    Route::apiResource('products', ProductController::class);
                    Route::apiResource('transfers', TransferController::class);
                    Route::post('transfers/{transfer}/validate', [TransferController::class , 'validateTransfer']);
                    Route::post('transfers/{transfer}/complete', [TransferController::class , 'complete']);
                    Route::post('transfers/{transfer}/refuse', [TransferController::class , 'refuse']);
                    Route::post('transfers/{transfer}/cancel', [TransferController::class , 'cancel']);
                    Route::post('installations', [InstallationController::class , 'install']);
                    Route::get('installations/stats', [InstallationController::class , 'stats']);
                }
                );

                // Orders management
                Route::apiResource('orders', OrderController::class)->only(['index', 'show', 'store', 'destroy']);
                Route::post('orders/{order}/receive', [OrderController::class , 'receive']);
                Route::post('orders/{order}/validate', [OrderController::class , 'validateOrder']);
                Route::post('orders/{order}/refuse', [OrderController::class , 'refuseOrder']);
                Route::post('orders/{order}/deliver', [OrderController::class , 'deliverOrder']);

                // Data access
                Route::get('sites', [SiteController::class , 'index']);
                Route::get('sites/{site}', [SiteController::class , 'show']);
                Route::get('suppliers', [SupplierController::class , 'index']);
                Route::get('suppliers/{supplier}', [SupplierController::class , 'show']);
        });
});
