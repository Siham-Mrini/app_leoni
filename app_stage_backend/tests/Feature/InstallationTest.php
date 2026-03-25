<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Product;
use App\Models\Site;
use App\Models\SiteProduct;
use App\Models\User;

class InstallationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_mark_product_as_installed()
    {
        $site = Site::create(['name' => 'S1', 'location' => 'L1']);
        $product = Product::create([
            'part_number' => 'P001', 
            'type' => 'A', 
            'family' => 'F1',
            'initial_site_id' => $site->id
        ]);
        $user = User::factory()->create(['site_id' => $site->id, 'role' => 'admin']);

        SiteProduct::create([
            'site_id' => $site->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'installed_quantity' => 0
        ]);

        $response = $this->actingAs($user)->postJson('/api/installations', [
            'site_id' => $site->id,
            'product_id' => $product->id,
            'quantity' => 5,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('site_product', [
            'site_id' => $site->id,
            'product_id' => $product->id,
            'installed_quantity' => 5,
            'quantity' => 5
        ]);
    }

    public function test_cannot_install_more_than_available_quantity()
    {
        $site = Site::create(['name' => 'S1', 'location' => 'L1']);
        $product = Product::create([
            'part_number' => 'P001', 
            'type' => 'A', 
            'family' => 'F1',
            'initial_site_id' => $site->id
        ]);
        $user = User::factory()->create(['site_id' => $site->id, 'role' => 'admin']);

        SiteProduct::create([
            'site_id' => $site->id,
            'product_id' => $product->id,
            'quantity' => 10,
            'installed_quantity' => 0
        ]);

        $response = $this->actingAs($user)->postJson('/api/installations', [
            'site_id' => $site->id,
            'product_id' => $product->id,
            'quantity' => 15,
        ]);

        $response->assertStatus(400);
    }
}
