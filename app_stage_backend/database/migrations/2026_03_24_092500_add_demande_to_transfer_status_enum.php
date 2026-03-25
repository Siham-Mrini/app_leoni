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
        Schema::table('transfers', function (Blueprint $table) {
            $table->string('status')->change();
        });

        // 2. We don't need to update existing records if we just want to ADD 'demande'
        // But let's ensure the new ENUM is comprehensive

        // 3. Change back to the new ENUM including 'demande'
        Schema::table('transfers', function (Blueprint $table) {
            $table->enum('status', ['demande', 'en cours', 'reçu', 'refusé', 'annulé'])->default('demande')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->string('status')->change();
        });

        // Map 'demande' back to 'en cours' or something else if reverting
        DB::table('transfers')->where('status', 'demande')->update(['status' => 'en cours']);

        Schema::table('transfers', function (Blueprint $table) {
            $table->enum('status', ['en cours', 'reçu', 'refusé', 'annulé'])->default('en cours')->change();
        });
    }
};
