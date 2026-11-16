<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'code',
        'title',
        'tagline',
        'description',
        'type',
        'mode',
        'participation',
        'team_size',
        'status',
        'visibility',
        'registration_open',
        'start_date',
        'end_date',
        'time',
        'duration',
        'venue',
        'location_details',
        'seats',
        'prize_pool',
        'perks',
        'tags',
        'speakers',
        'banner_img',
        'registration_url',
        'created_by',
    ];

    protected $casts = [
        'registration_open' => 'boolean',
        'perks' => 'array',
        'tags' => 'array',
        'speakers' => 'array',
    ];

    public function registrations()
    {
        return $this->hasMany(EventRegistration::class, 'event_id');
    }
}

