<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasFactory;
    protected $fillable = [
        'tenant_id',
        'subscription_id',
        'amount',
        'currency',
        'status',
        'stripe_invoice_id',
        'issue_date',
        'due_date',
        'paid_at',
        'description',
        'discount_amount',
        'invoice_number',
        'pdf_url',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    // Relacionamentos
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    // Métodos utilitários
    public function isPaid(): bool
    {
        return $this->status === 'paid' && $this->paid_at !== null;
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function isOverdue(): bool
    {
        return !$this->isPaid() && $this->due_date < now()->toDateString();
    }

    public function getAmountFormatted(): string
    {
        return '$' . number_format($this->amount / 100, 2) . ' ' . $this->currency;
    }

    // Scopes
    public function scopePaid()
    {
        return $this->where('status', 'paid');
    }

    public function scopePending()
    {
        return $this->whereIn('status', ['draft', 'sent']);
    }

    public function scopeOverdue()
    {
        return $this->where('status', '!=', 'paid')
            ->whereDate('due_date', '<', now());
    }
}
