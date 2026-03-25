<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Transfer;
use App\Models\Product;
use App\Models\Site;
use App\Models\SiteProduct;
use App\Models\User;

class TransferTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_transfer_without_sufficient_stock()
    {
        $site1 = Site::create(['name' => 'S1', 'location' => 'L1']);
        $site2 = Site::create(['name' => 'S2', 'location' => 'L2']);
        $product = Product::create([
            'part_number' => 'P001', 
            'type' => 'A', 
            'family' => 'F1',
            'initial_site_id' => $site1->id
        ]);
        $user = User::factory()->create(['site_id' => $site1->id, 'role' => 'admin']);

        // Stock exists but not enough
        SiteProduct::create([
            'site_id' => $site1->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'installed_quantity' => 0
        ]);

        $response = $this->actingAs($user)->postJson('/api/transfers', [
            'from_site_id' => $site1->id,
            'to_site_id' => $site2->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $response->assertStatus(400);
        $this->assertDatabaseMissing('transfers', ['quantity' => 10]);
    }

    public function test_completing_transfer_reduces_source_and_increases_dest_stock()
    {
        $site1 = Site::create(['name' => 'S1', 'location' => 'L1']);
        $site2 = Site::create(['name' => 'S2', 'location' => 'L2']);
        $product = Product::create([
            'part_number' => 'P001', 
            'type' => 'A', 
            'family' => 'F1',
            'initial_site_id' => $site1->id
        ]);
        $user = User::factory()->create(['site_id' => $site1->id, 'role' => 'admin']);

        SiteProduct::create([
            'site_id' => $site1->id,
            'product_id' => $product->id,
            'quantity' => 50,
            'installed_quantity' => 0
        ]);

        $transferSourceStock = SiteProduct::where('site_id', $site1->id)->where('product_id', $product->id)->first();
        $transferSourceStock->quantity -= 20;
        $transferSourceStock->save();

        $transferDestStock = SiteProduct::firstOrNew(['site_id' => $site2->id, 'product_id' => $product->id]);
        $transferDestStock->pending_quantity += 20;
        $transferDestStock->save();

        $transfer = Transfer::create([
            'from_site_id' => $site1->id,
            'to_site_id' => $site2->id,
            'product_id' => $product->id,
            'quantity' => 20,
            'status' => 'en cours'
        ]);

        $response = $this->actingAs($user)->postJson("/api/transfers/{$transfer->id}/complete");

        $response->assertStatus(200);

        // Assert Source Site Stock dropped by 20 (now 30)
        $this->assertDatabaseHas('site_product', [
            'site_id' => $site1->id,
            'product_id' => $product->id,
            'quantity' => 30
        ]);

        // Assert Dest Site Stock went up by 20 (now 20)
        $this->assertDatabaseHas('site_product', [
            'site_id' => $site2->id,
            'product_id' => $product->id,
            'quantity' => 20
        ]);

        $this->assertDatabaseHas('transfers', [
            'id' => $transfer->id,
            'status' => 'reçu'
        ]);
    }
}
