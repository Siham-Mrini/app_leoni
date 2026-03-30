<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_site_id', 'to_site_id', 'product_id', 'quantity', 'status', 'transfer_date',
        'validated_by', 'validated_at', 'delivered_by', 'delivered_at', 'received_by', 'received_at'
    ];

    protected $casts = [
        'transfer_date' => 'datetime',
        'validated_at' => 'datetime',
        'delivered_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function fromSite()
    {
        return $this->belongsTo(Site::class, 'from_site_id');
    }

    public function toSite()
    {
        return $this->belongsTo(Site::class, 'to_site_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    
    public function validatedBy()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function deliveredBy()
    {
        return $this->belongsTo(User::class, 'delivered_by');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
    
    public function logs()
    {
        return $this->hasMany(TransferLog::class);
    }
}
