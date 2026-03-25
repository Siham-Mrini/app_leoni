<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DashboardDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sites = \App\Models\Site::all();
        $products = \App\Models\Product::all();
        $suppliers = \App\Models\Supplier::all();

        if ($sites->isEmpty() || $products->isEmpty() || $suppliers->isEmpty()) {
            return;
        }

        // Create random orders for the last 7 days to populate the chart
        for ($i = 0; $i < 7; $i++) {
            $date = \Carbon\Carbon::now()->subDays($i);
            $numOrders = rand(5, 20);

            for ($j = 0; $j < $numOrders; $j++) {
                \App\Models\Order::create([
                    'site_id' => $sites->random()->id,
                    'product_id' => $products->random()->id,
                    'supplier_id' => $suppliers->random()->id,
                    'quantity' => rand(10, 100),
                    'status' => 'sent',
                    'created_at' => $date->copy()->addHours(rand(0, 23))->addMinutes(rand(0, 59)),
                ]);
            }
        }
    }
}
