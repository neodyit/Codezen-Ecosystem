<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
        'user_name',
        'user_email',
        'user_phone',
        'roll_no',
        'college',
        'team_name',
        'team_members',
        'status',
        'attendance_status',
        'attended_at',
        'qr_token',
    ];

    protected $casts = [
        'team_members' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class, 'event_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

