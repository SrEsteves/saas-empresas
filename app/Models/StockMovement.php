<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'tenant_id', 'product_id', 'quantity', 'reason', 'type'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
