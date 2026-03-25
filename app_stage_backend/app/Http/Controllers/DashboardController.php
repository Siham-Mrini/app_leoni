<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Site;
use App\Models\Supplier;
use App\Models\Order;
use App\Models\Transfer;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        // Optimized chart data (single query for last 7 days)
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $ordersByDay = Order::where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->get()
            ->pluck('count', 'date');

        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dateStr = $date->toDateString();
            $chartData[] = [
                'name' => $date->format('D'),
                'orders' => $ordersByDay[$dateStr] ?? 0
            ];
        }

        return response()->json([
            'products_count' => Product::count(),
            'sites_count' => Site::count(),
            'suppliers_count' => Supplier::count(),
            'pending_orders' => Order::where('status', '!=', 'received')->count(),
            'pending_transfers' => Transfer::where('status', 'pending')->count(),
            'recent_orders' => Order::with(['product', 'site', 'supplier'])->latest()->take(5)->get(),
            'recent_transfers' => Transfer::with(['product', 'fromSite', 'toSite'])->latest()->take(5)->get(),
            'recent_products' => Product::latest()->take(5)->get(),
            'chart_data' => $chartData
        ]);
    }
}
