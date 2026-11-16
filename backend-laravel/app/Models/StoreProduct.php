<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreProduct extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'category',
        'price',
        'original_price',
        'stock',
        'status',
        'description',
        'sizes',
        'image_url',
    ];

    protected $casts = [
        'sizes' => 'array',
        'price' => 'float',
        'original_price' => 'float',
        'stock' => 'integer',
    ];
}

