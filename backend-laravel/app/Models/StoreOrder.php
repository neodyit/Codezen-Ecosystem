<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreOrder extends Model
{
    protected $table = 'store_orders';

    protected $fillable = [
        'order_number',
        'user_id',
        'product_id',
        'product_name',
        'product_sku',
        'category',
        'size',
        'price',
        'quantity',
        'total_amount',
        'buyer_name',
        'buyer_email',
        'roll_no',
        'pickup_notes',
        'status',
        'pickup_token',
    ];

    protected $casts = [
        'price' => 'float',
        'total_amount' => 'float',
        'quantity' => 'integer',
        'user_id' => 'integer',
        'product_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(StoreProduct::class, 'product_id');
    }
}

