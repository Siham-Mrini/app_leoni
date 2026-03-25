<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory, \App\Traits\LogsActions;

    protected $fillable = ['name', 'contact_person', 'contact_email', 'phone'];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
