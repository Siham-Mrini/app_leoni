<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Order;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Site;
use App\Models\SiteProduct;
use App\Models\User;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_order()
    {
        $site = Site::create(['name' => 'S1', 'location' => 'L1']);
        $product = Product::create([
            'part_number' => 'P001', 
            'type' => 'A', 
            'family' => 'F1',
            'initial_site_id' => $site->id
        ]);
        $user = User::factory()->create(['site_id' => $site->id, 'role' => 'admin']);
        $supplier = Supplier::create([
            'name' => 'S1', 
            'contact_person' => 'Person 1', 
            'phone' => '123'
        ]);

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'supplier_id' => $supplier->id,
            'site_id' => $site->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'order_number' => 'ORD-123',
            'order_date' => '2026-03-18'
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['status' => 'en attente', 'quantity' => 10]);

        $this->assertDatabaseHas('orders', ['status' => 'en attente', 'quantity' => 10]);
    }

    public function test_receiving_order_updates_site_stock()
    {
        $site = Site::create(['name' => 'S1', 'location' => 'L1']);
        $product = Product::create([
            'part_number' => 'P001', 
            'type' => 'A', 
            'family' => 'F1',
            'initial_site_id' => $site->id
        ]);
        $user = User::factory()->create(['site_id' => $site->id, 'role' => 'admin']);
        $supplier = Supplier::create([
            'name' => 'S1', 
            'contact_person' => 'Person 1', 
            'phone' => '123'
        ]);

        $order = Order::create([
            'supplier_id' => $supplier->id,
            'site_id' => $site->id,
            'product_id' => $product->id,
            'quantity' => 50,
            'status' => 'en attente',
            'order_number' => 'ORD-123',
            'order_date' => '2026-03-18'
        ]);

        $response = $this->actingAs($user)->postJson("/api/orders/{$order->id}/receive");

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'reçue']);

        $this->assertDatabaseHas('site_product', [
            'site_id' => $site->id,
            'product_id' => $product->id,
            'quantity' => 50
        ]);
    }
}
