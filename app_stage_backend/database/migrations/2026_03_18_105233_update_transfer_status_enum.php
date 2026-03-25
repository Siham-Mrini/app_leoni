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
        Schema::table('transfers', function (Blueprint $table) {
            $table->string('status')->change();
        });

        DB::table('transfers')->where('status', 'pending')->update(['status' => 'en cours']);
        DB::table('transfers')->where('status', 'completed')->update(['status' => 'reçu']);
        DB::table('transfers')->where('status', 'refused')->update(['status' => 'refusé']);
        DB::table('transfers')->where('status', 'canceled')->update(['status' => 'annulé']);

        Schema::table('transfers', function (Blueprint $table) {
            $table->enum('status', ['en cours', 'reçu', 'refusé', 'annulé'])->default('en cours')->change();
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

        DB::table('transfers')->where('status', 'en cours')->update(['status' => 'pending']);
        DB::table('transfers')->where('status', 'reçu')->update(['status' => 'completed']);
        DB::table('transfers')->where('status', 'refusé')->update(['status' => 'refused']);
        DB::table('transfers')->where('status', 'annulé')->update(['status' => 'canceled']);

        Schema::table('transfers', function (Blueprint $table) {
            $table->enum('status', ['pending', 'completed', 'refused', 'canceled'])->default('pending')->change();
        });
    }
};
