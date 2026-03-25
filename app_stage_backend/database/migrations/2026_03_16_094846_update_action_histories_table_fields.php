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
        Schema::table('action_histories', function (Blueprint $table) {
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->string('table_name')->nullable();
            $table->unsignedBigInteger('record_id')->nullable();
            $table->string('ip_address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('action_histories', function (Blueprint $table) {
            $table->dropColumn(['user_name', 'user_role', 'table_name', 'record_id', 'ip_address']);
        });
    }
};
