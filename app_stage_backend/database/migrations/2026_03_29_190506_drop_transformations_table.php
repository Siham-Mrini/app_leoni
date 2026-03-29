<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('transformations');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('transformations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_site_id')->constrained('sites')->onDelete('cascade');
            $table->foreignId('destination_site_id')->constrained('sites')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantity');
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }
};
