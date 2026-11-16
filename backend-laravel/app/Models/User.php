<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'google_token',
        'profile_completed',
        'phone',
        'roll_no',
        'department',
        'branch',
        'course',
        'semester',
        'college',
        'university',
        'college_id',
        'course_id',
        'branch_id',
        'semester_id',
        'department_id',
        'university_id',
        'role',      
        'type',      
        'status',
        'team',      
        'position',  
        'tag',
        'show_on_website',
        'can_scan_qr',
        'website_order',
        'bio',
        'avatar',
        'linkedin',
        'github',
    ];

    protected $hidden = [
        'password',
        'google_token',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'show_on_website' => 'boolean',
            'can_scan_qr' => 'boolean',
            'website_order' => 'integer',
        ];
    }

    /**
     * Normalized Academic Relationships with AppSetting taxonomy
     */
    public function collegeSetting()
    {
        return $this->belongsTo(AppSetting::class, 'college_id');
    }

    public function courseSetting()
    {
        return $this->belongsTo(AppSetting::class, 'course_id');
    }

    public function branchSetting()
    {
        return $this->belongsTo(AppSetting::class, 'branch_id');
    }

    public function semesterSetting()
    {
        return $this->belongsTo(AppSetting::class, 'semester_id');
    }

    public function departmentSetting()
    {
        return $this->belongsTo(AppSetting::class, 'department_id');
    }

    public function universitySetting()
    {
        return $this->belongsTo(AppSetting::class, 'university_id');
    }

    /**
     * Team memberships relationship (enables multi-domain / dual-role membership)
     */
    public function memberships()
    {
        return $this->hasMany(TeamMembership::class);
    }

    /**
     * Normalized teams relationship
     */
    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_memberships')
            ->withPivot(['designation', 'position', 'is_primary', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Audit logs authored by this user
     */
    public function authoredAuditLogs()
    {
        return $this->hasMany(AuditLog::class, 'actor_id');
    }

    /**
     * Helper: Check if user is an Executive (President or Vice President)
     */
    public function isExecutive(): bool
    {
        return $this->role === 'Admin' || 
               in_array($this->position, ['President', 'Vice President']) ||
               $this->memberships()->where('position', 'President')->exists() ||
               $this->memberships()->where('position', 'Vice President')->exists();
    }

    /**
     * Helper: Check if user is a Team Lead
     */
    public function isLead(): bool
    {
        if ($this->isExecutive()) {
            return true;
        }

        return $this->type === 'Lead' || 
               in_array($this->position, [
                   'Head',
                   'Co-Head',
                   'Lead',
                   'Co-Lead',
                   'General Secretary',
                   'Joint Secretary',
                   'Treasurer',
               ]) ||
               $this->memberships()->whereIn('designation', ['Lead', 'Co-Head'])->exists();
    }

    /**
     * Helper: Check if user can manage a given team
     */
    public function canManageTeam(string $teamName): bool
    {
        if ($this->isExecutive()) {
            return true;
        }

        return $this->isLead() && (
            $this->team === $teamName ||
            $this->teams()->where('name', $teamName)->exists()
        );
    }

    /**
     * Determine the user's primary security role for RBAC resolution
     */
    public function getEffectiveRbacRole(): string
    {
        if ($this->isExecutive()) {
            return 'Admin';
        }

        if ($this->type === 'Lead' || $this->isLead()) {
            return 'Lead';
        }

        if ($this->role === 'Team' || $this->type === 'Member') {
            return 'Member';
        }

        return 'User';
    }

    /**
     * Check if user has a specific permission key via RBAC dynamic permissions
     */
    public function hasPermission(string $permissionKey): bool
    {
        // System Administrators always retain full permissions
        if ($this->isExecutive()) {
            return true;
        }

        $rolesToCheck = array_unique(array_filter([
            $this->getEffectiveRbacRole(),
            $this->role,
            $this->type,
            $this->position,
        ]));

        return \App\Models\RolePermission::whereIn('role_name', $rolesToCheck)
            ->where('permission_key', $permissionKey)
            ->exists();
    }

    /**
     * Get all assigned RBAC permission keys for this user
     */
    public function getAssignedPermissions(): array
    {
        if ($this->isExecutive()) {
            return \App\Models\RolePermission::where('role_name', 'Admin')
                ->pluck('permission_key')
                ->toArray();
        }

        $rolesToCheck = array_unique(array_filter([
            $this->getEffectiveRbacRole(),
            $this->role,
            $this->type,
            $this->position,
        ]));

        return \App\Models\RolePermission::whereIn('role_name', $rolesToCheck)
            ->pluck('permission_key')
            ->unique()
            ->values()
            ->toArray();
    }
}
