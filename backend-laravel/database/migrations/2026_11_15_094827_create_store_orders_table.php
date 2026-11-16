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
        if (!Schema::hasTable('store_orders')) {
            Schema::create('store_orders', function (Blueprint $table) {
                $table->increments('id');
                $table->string('order_number', 50)->unique();
                $table->integer('user_id')->unsigned()->nullable();
                $table->integer('product_id')->unsigned()->nullable();
                $table->string('product_name', 200);
                $table->string('product_sku', 50)->nullable();
                $table->string('category', 100)->nullable();
                $table->string('size', 20)->nullable();
                $table->decimal('price', 10, 2)->default(0.00);
                $table->integer('quantity')->default(1);
                $table->decimal('total_amount', 10, 2)->default(0.00);
                $table->string('buyer_name', 150);
                $table->string('buyer_email', 150);
                $table->string('roll_no', 50)->nullable();
                $table->text('pickup_notes')->nullable();
                $table->enum('status', ['Pending', 'Confirmed', 'Ready for Pickup', 'Fulfilled', 'Cancelled'])->default('Confirmed');
                $table->string('pickup_token', 100)->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_orders');
    }
};
