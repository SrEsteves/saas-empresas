<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

class Service extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'name',
        'duration_minutes',
        'price',
        'is_active',
    ];

    public function employees()
    {
        return $this->belongsToMany(Employee::class);
    }
}
