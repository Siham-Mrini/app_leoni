<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory, \App\Traits\LogsActions;

    protected $fillable = ['supplier_id', 'site_id', 'product_id', 'quantity', 'status', 'order_number', 'order_date'];

    public function items()
    {
        return $this->hasMany(CommandeItem::class, 'order_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
