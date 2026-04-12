<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    protected $fillable = [
        'tenant_id', 'category_id', 'name', 'sku',
        'cost_price', 'sale_price', 'current_stock', 'minimum_stock'
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tenant() : BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class)->withPivot('quantity')->withTimestamps();
    }
}
