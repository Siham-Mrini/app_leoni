<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Temporarily change to string to allow any value
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->change();
        });

        // 2. Update existing records
        DB::table('orders')->where('status', 'sent')->update(['status' => 'en attente']);
        DB::table('orders')->where('status', 'delivering')->update(['status' => 'en livraison']);
        DB::table('orders')->where('status', 'received')->update(['status' => 'reçue']);

        // 3. Change back to the new ENUM
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['en attente', 'en livraison', 'reçue', 'refusée', 'annulée'])->default('en attente')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status')->change();
        });

        DB::table('orders')->where('status', 'en attente')->update(['status' => 'sent']);
        DB::table('orders')->where('status', 'en livraison')->update(['status' => 'delivering']);
        DB::table('orders')->where('status', 'reçue')->update(['status' => 'received']);

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['sent', 'delivering', 'received'])->default('sent')->change();
        });
    }
};
