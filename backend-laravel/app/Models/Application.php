<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'roll_no',
        'department',
        'course',
        'semester',
        'target_team',
        'target_position',
        'portfolio_url',
        'github_url',
        'statement_of_purpose',
        'status',
        'reviewer_notes',
        'reviewed_by',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}

