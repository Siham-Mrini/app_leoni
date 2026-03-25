<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, \App\Traits\LogsActions;

    protected $fillable = ['part_number', 'sku', 'type', 'family', 'price', 'image_url', 'supplier_id', 'is_installed', 'initial_site_id'];

    public function initialSite()
    {
        return $this->belongsTo(Site::class, 'initial_site_id');
    }

    public function sites()
    {
        return $this->belongsToMany(Site::class, 'site_product')
                    ->withPivot('quantity', 'installed_quantity')
                    ->withTimestamps();
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
