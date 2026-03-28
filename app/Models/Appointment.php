<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

class Appointment extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'service_id',
        'client_name',
        'client_phone',
        'start_time',
        'end_time',
        'status',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}