<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transfer extends Model
{
    use HasFactory;

    protected $fillable = ['from_site_id', 'to_site_id', 'product_id', 'quantity', 'status', 'transfer_date'];

    protected $casts = [
        'transfer_date' => 'datetime',
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
}
