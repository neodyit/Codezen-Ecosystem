<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'sort_order',
        'is_active',
    ];

    public function memberships()
    {
        return $this->hasMany(TeamMembership::class);
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'team_memberships')
            ->withPivot(['designation', 'position', 'is_primary', 'joined_at'])
            ->withTimestamps();
    }
}
