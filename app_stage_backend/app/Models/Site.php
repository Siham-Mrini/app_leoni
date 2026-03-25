<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    use HasFactory, \App\Traits\LogsActions;

    protected $fillable = ['name', 'location'];

    public function products()
    {
        return $this->belongsToMany(Product::class, 'site_product')
                    ->withPivot('quantity', 'installed_quantity')
                    ->withTimestamps();
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function transfersFrom()
    {
        return $this->hasMany(Transfer::class, 'from_site_id');
    }

    public function transfersTo()
    {
        return $this->hasMany(Transfer::class, 'to_site_id');
    }
}
