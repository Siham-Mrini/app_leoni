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
        // 1. Rename tables
        Schema::rename('branches', 'sites');
        Schema::rename('branch_product', 'site_product');

        // 2. Rename columns in users
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('branch_id', 'site_id');
        });

        // 3. Rename columns in products
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('reference', 'part_number');
            $table->foreignId('supplier_id')->nullable()->after('family')->constrained()->onDelete('set null');
        });

        // 4. Rename columns in suppliers
        Schema::table('suppliers', function (Blueprint $table) {
            $table->renameColumn('contact_email', 'contact_person');
        });

        // 5. Rename columns and add field in orders
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('branch_id', 'site_id');
            $table->string('order_number')->nullable()->after('id');
        });

        // 6. Rename columns in transfers
        Schema::table('transfers', function (Blueprint $table) {
            $table->renameColumn('from_branch_id', 'from_site_id');
            $table->renameColumn('to_branch_id', 'to_site_id');
        });

        // 7. Rename columns in action_histories
        Schema::table('action_histories', function (Blueprint $table) {
            $table->renameColumn('branch_id', 'site_id');
        });

        // 8. Rename columns in site_product (previously branch_product)
        Schema::table('site_product', function (Blueprint $table) {
            $table->renameColumn('branch_id', 'site_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_product', function (Blueprint $table) {
            $table->renameColumn('site_id', 'branch_id');
        });

        Schema::table('action_histories', function (Blueprint $table) {
            $table->renameColumn('site_id', 'branch_id');
        });

        Schema::table('transfers', function (Blueprint $table) {
            $table->renameColumn('from_site_id', 'from_branch_id');
            $table->renameColumn('to_site_id', 'to_branch_id');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('site_id', 'branch_id');
            $table->dropColumn('order_number');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->renameColumn('contact_person', 'contact_email');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('part_number', 'reference');
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('site_id', 'branch_id');
        });

        Schema::rename('site_product', 'branch_product');
        Schema::rename('sites', 'branches');
    }
};
