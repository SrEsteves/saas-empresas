<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    // Liberamos as novas colunas para serem salvas no banco
    protected $fillable = [
        'name', 
        'is_active',
        'working_hours',
        'closed_dates',
        'bot_message',
        'confirmation_message',
        'cancellation_message'
    ];

    protected $casts = [
        'working_hours' => 'array',
        'closed_dates' => 'array',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}