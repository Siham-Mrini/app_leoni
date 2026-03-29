<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emplacement extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'site_id'];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
