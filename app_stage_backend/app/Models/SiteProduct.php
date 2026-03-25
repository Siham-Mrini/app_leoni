<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class SiteProduct extends Pivot
{
    use HasFactory;

    protected $table = 'site_product';

    protected $fillable = ['site_id', 'product_id', 'quantity', 'installed_quantity'];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
