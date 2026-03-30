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
        Schema::table('transfers', function (Blueprint $table) {
            $table->string('status')->change();
            
            $table->unsignedBigInteger('validated_by')->nullable();
            $table->timestamp('validated_at')->nullable();
            
            $table->unsignedBigInteger('delivered_by')->nullable();
            $table->timestamp('delivered_at')->nullable();
            
            $table->unsignedBigInteger('received_by')->nullable();
            $table->timestamp('received_at')->nullable();
            
            $table->foreign('validated_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('delivered_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('received_by')->references('id')->on('users')->nullOnDelete();
        });

        // Map existing data
        \Illuminate\Support\Facades\DB::table('transfers')->where('status', 'demande')->update(['status' => 'en_attente']);
        \Illuminate\Support\Facades\DB::table('transfers')->where('status', 'en cours')->update(['status' => 'en_livraison']);
        
        // Supprime les anciens statuts non supportés dans le nouvel enum
        \Illuminate\Support\Facades\DB::table('transfers')->whereIn('status', ['refusé', 'annulé'])->delete();
        
        Schema::table('transfers', function (Blueprint $table) {
            $table->enum('status', ['en_attente', 'validé', 'en_livraison', 'reçu'])->default('en_attente')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transfers', function (Blueprint $table) {
            $table->dropForeign(['validated_by']);
            $table->dropForeign(['delivered_by']);
            $table->dropForeign(['received_by']);
            
            $table->dropColumn(['validated_by', 'validated_at', 'delivered_by', 'delivered_at', 'received_by', 'received_at']);
            
            $table->string('status')->change();
        });
        
        \Illuminate\Support\Facades\DB::table('transfers')->where('status', 'en_attente')->update(['status' => 'demande']);
        \Illuminate\Support\Facades\DB::table('transfers')->where('status', 'en_livraison')->update(['status' => 'en cours']);
        
        Schema::table('transfers', function (Blueprint $table) {
            $table->enum('status', ['demande', 'en cours', 'reçu', 'refusé', 'annulé'])->default('demande')->change();
        });
    }
};
