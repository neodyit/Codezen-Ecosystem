<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class AdminController extends Controller
{
    /**
     * Retrieve all official teams from database.
     */
    public function getTeams()
    {
        $teams = Team::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'teams' => $teams,
        ]);
    }

    /**
     * Get users list based on role hierarchy:
     * - President & Vice President (Executive / Admin): Can view and manage all users.
     * - Team Leads: Can view and manage members belonging to their respective team.
     * - Normal Users: No access to member management.
     */
    public function getUsers(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $search = trim($request->input('search', ''));
        $roleFilter = $request->input('role', ''); // 'User' for attendees, 'Team' for members, or empty for all
        $perPage = (int) $request->input('per_page', 0); // 0 = return all (legacy), >0 = paginated

        // Executives have global access to all records
        if (Gate::allows('manage-all')) {
            $query = User::with(['memberships.team'])
                ->orderBy('id', 'desc');

            $meta = [
                'scope' => 'all',
                'manageable' => true,
                'role' => $currentUser->role,
                'position' => $currentUser->position,
                'can_manage_all' => true,
            ];
        } elseif (Gate::allows('manage-team') || $currentUser->isLead() || $currentUser->hasPermission('users.view') || $currentUser->hasPermission('members.view')) {
            // Team Leads and members with view permissions can see all members/community users across teams
            $query = User::with(['memberships.team'])
                ->orderBy('id', 'desc');

            $meta = [
                'scope' => 'all',
                'team' => $currentUser->team,
                'manageable' => $currentUser->isLead(),
                'role' => $currentUser->role,
                'position' => $currentUser->position,
                'can_manage_all' => false,
            ];
        } else {
            return response()->json([
                'error' => 'Access denied. You do not have permissions to manage community members.',
            ], 403);
        }

        // Apply role filter if requested
        if (!empty($roleFilter)) {
            if ($roleFilter === 'Team') {
                $query->whereIn('role', ['Team', 'Admin']);
            } else {
                $query->where('role', $roleFilter);
            }
        }

        // Apply search if requested
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('roll_no', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%")
                  ->orWhere('branch', 'like', "%{$search}%")
                  ->orWhere('college', 'like', "%{$search}%");
            });
        }

        // If pagination requested, use Laravel's standard paginate
        if ($perPage > 0) {
            $paginator = $query->paginate($perPage);
            return response()->json([
                'success' => true,
                'meta' => $meta,
                'users' => $paginator->items(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                ],
            ]);
        }

        $users = $query->get();

        return response()->json([
            'success' => true,
            'meta' => $meta,
            'users' => $users,
        ]);
    }

    /**
     * Update a user's role, type, team, position, or status with audit logging.
     * Only accessible by President / Vice President, or Team Lead within their team.
     */
    public function updateUser(Request $request, $id)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $targetUser = User::find($id);
        if (!$targetUser) {
            return response()->json(['error' => 'Target user not found.'], 404);
        }

        // Validate allowed changes
        $request->validate([
            'email' => 'nullable|email|max:150|unique:users,email,' . $targetUser->id,
            'role' => 'nullable|string|in:Admin,Team,User',
            'type' => 'nullable|string|in:Admin,Lead,Member,User',
            'team' => 'nullable|string|max:100',
            'position' => 'nullable|string|max:100',
            'tag' => 'nullable|string|max:100',
            'show_on_website' => 'nullable|boolean',
            'website_order' => 'nullable|integer',
            'status' => 'nullable|string|in:active,blocked',
            'name' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'roll_no' => 'nullable|string|max:50',
            'department' => 'nullable|string|max:100',
            'branch' => 'nullable|string|max:100',
            'course' => 'nullable|string|max:100',
            'semester' => 'nullable|string|max:50',
            'college' => 'nullable|string|max:150',
            'university' => 'nullable|string|max:150',
            'avatar' => 'nullable|string|max:255',
            'linkedin' => 'nullable|string|max:255',
            'github' => 'nullable|string|max:255',
        ]);

        $changes = [];

        DB::beginTransaction();
        try {
            if (Gate::allows('manage-all')) {
                // Executive can update any user to any role/type/team/position/status
                if ($request->has('status') && $request->input('status') !== $targetUser->status) {
                    $changes['status'] = ['from' => $targetUser->status, 'to' => $request->input('status')];
                    $targetUser->status = $request->input('status');
                }
                if ($request->has('name') && $request->input('name')) {
                    $targetUser->name = trim($request->input('name'));
                }
                if ($request->has('email') && $request->input('email')) {
                    $targetUser->email = strtolower(trim($request->input('email')));
                }
                if ($request->has('phone')) {
                    $targetUser->phone = trim($request->input('phone'));
                }
                if ($request->has('roll_no')) {
                    $targetUser->roll_no = trim($request->input('roll_no'));
                }
                if ($request->has('department')) {
                    $val = trim($request->input('department'));
                    $targetUser->department = $val;
                    $targetUser->department_id = \App\Models\AppSetting::where('type', 'department')->where('name', $val)->value('id');
                }
                if ($request->has('branch')) {
                    $val = trim($request->input('branch'));
                    $targetUser->branch = $val;
                    $targetUser->branch_id = \App\Models\AppSetting::where('type', 'branch')
                        ->where(function ($q) use ($val) {
                            $q->where('name', $val)
                              ->orWhereRaw('LOWER(name) = ?', [strtolower($val)]);
                        })->value('id');
                }
                if ($request->has('course')) {
                    $val = trim($request->input('course'));
                    $targetUser->course = $val;
                    $targetUser->course_id = \App\Models\AppSetting::where('type', 'course')->where('name', $val)->value('id');
                }
                if ($request->has('semester')) {
                    $val = trim($request->input('semester'));
                    $targetUser->semester = $val;
                    $targetUser->semester_id = \App\Models\AppSetting::where('type', 'semester')->where('name', $val)->value('id');
                }
                if ($request->has('college')) {
                    $val = trim($request->input('college'));
                    $targetUser->college = $val;
                    $targetUser->college_id = \App\Models\AppSetting::where('type', 'college')->where('name', $val)->value('id');
                }
                if ($request->has('university')) {
                    $val = trim($request->input('university'));
                    $targetUser->university = $val;
                    $targetUser->university_id = \App\Models\AppSetting::where('type', 'university')->where('name', $val)->value('id');
                }
                if ($request->has('role') && $request->input('role') !== $targetUser->role) {
                    $changes['role'] = ['from' => $targetUser->role, 'to' => $request->input('role')];
                    $targetUser->role = $request->input('role');
                }
                if ($request->has('type') && $request->input('type') !== $targetUser->type) {
                    $changes['type'] = ['from' => $targetUser->type, 'to' => $request->input('type')];
                    $targetUser->type = $request->input('type');
                }
                if ($request->has('team') && $request->input('team') !== $targetUser->team) {
                    $changes['team'] = ['from' => $targetUser->team, 'to' => $request->input('team')];
                    $targetUser->team = $request->input('team');
                }
                if ($request->has('position') && $request->input('position') !== $targetUser->position) {
                    $changes['position'] = ['from' => $targetUser->position, 'to' => $request->input('position')];
                    $targetUser->position = $request->input('position');
                }
                if ($request->has('tag')) {
                    $targetUser->tag = $request->input('tag');
                }
                if ($request->has('show_on_website')) {
                    $targetUser->show_on_website = (bool) $request->input('show_on_website');
                }
                if ($request->has('can_scan_qr')) {
                    $targetUser->can_scan_qr = (bool) $request->input('can_scan_qr');
                }
                if ($request->has('website_order')) {
                    $targetUser->website_order = (int) $request->input('website_order');
                }
                if ($request->has('avatar')) {
                    $targetUser->avatar = $request->input('avatar');
                }
                if ($request->has('linkedin')) {
                    $targetUser->linkedin = $request->input('linkedin');
                }
                if ($request->has('github')) {
                    $targetUser->github = $request->input('github');
                }
            } elseif ($currentUser->isLead() || Gate::allows('manage-team', $targetUser->team)) {
                // Team Leads can promote community users into their respective team as Member,
                // or modify existing members of their own team.
                if ($targetUser->role === 'User') {
                    // Lead promoting a community user directly into their team
                    $leadTeam = $currentUser->team ?: 'Technical';
                    $newPosition = $request->input('position') ?: 'Core Member';

                    $changes['role'] = ['from' => $targetUser->role, 'to' => 'Team'];
                    $changes['type'] = ['from' => $targetUser->type, 'to' => 'Member'];
                    $changes['team'] = ['from' => $targetUser->team, 'to' => $leadTeam];
                    $changes['position'] = ['from' => $targetUser->position, 'to' => $newPosition];

                    $targetUser->role = 'Team';
                    $targetUser->type = 'Member';
                    $targetUser->team = $leadTeam;
                    $targetUser->position = $newPosition;
                    if ($request->has('tag')) $targetUser->tag = $request->input('tag');
                } else {
                    // Lead managing existing team member: can only manage members within their own team
                    if ($targetUser->team !== $currentUser->team) {
                        return response()->json(['error' => 'You can only manage members within your team.'], 403);
                    }

                    if ($request->has('tag')) $targetUser->tag = $request->input('tag');
                    if ($request->has('type') && in_array($request->input('type'), ['Member', 'User'])) {
                        $newType = $request->input('type');
                        $newRole = $newType === 'Member' ? 'Team' : 'User';

                        $changes['type'] = ['from' => $targetUser->type, 'to' => $newType];
                        $targetUser->type = $newType;
                        $targetUser->role = $newRole;
                    }
                }
            } else {
                return response()->json(['error' => 'Unauthorized action.'], 403);
            }

            $targetUser->save();

            // Sync with normalized team_memberships table if team is assigned
            if ($targetUser->team) {
                $teamModel = Team::where('name', $targetUser->team)->first();
                if ($teamModel) {
                    TeamMembership::updateOrInsert(
                        ['user_id' => $targetUser->id, 'team_id' => $teamModel->id],
                        [
                            'designation' => $targetUser->type === 'Lead' ? 'Lead' : 'Member',
                            'position' => $targetUser->position,
                            'is_primary' => true,
                            'updated_at' => now(),
                        ]
                    );
                }
            }

            // Write to Governance Audit Log
            if (!empty($changes)) {
                AuditLog::create([
                    'actor_id' => $currentUser->id,
                    'target_id' => $targetUser->id,
                    'action' => 'membership_hierarchy_updated',
                    'details' => json_encode($changes),
                    'ip_address' => $request->ip(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User hierarchy updated and recorded in audit log.',
                'user' => $targetUser->load('memberships.team'),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update hierarchy: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove / Demote a member from team (Accessible to Admin or Team Lead for their own team members)
     */
    public function removeMember(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $targetUser = User::findOrFail($id);

        // Cannot remove oneself
        if ($targetUser->id === $currentUser->id) {
            return response()->json(['error' => 'You cannot remove yourself from the team.'], 400);
        }

        // Cannot remove an Admin / Executive unless super admin
        if ($targetUser->isExecutive() && !$currentUser->isExecutive()) {
            return response()->json(['error' => 'Cannot remove an executive administrator.'], 403);
        }

        // Authorization check: Admin can remove anyone, Lead can remove their own team members
        $isAdmin = Gate::allows('manage-all') || $currentUser->isExecutive();
        $isLeadOfTeam = ($currentUser->isLead() || Gate::allows('manage-team')) && 
                        !empty($currentUser->team) && 
                        strcasecmp($currentUser->team, $targetUser->team) === 0;

        if (!$isAdmin && !$isLeadOfTeam) {
            return response()->json(['error' => 'Unauthorized. Leads can only remove members from their own team.'], 403);
        }

        DB::beginTransaction();
        try {
            $prevTeam = $targetUser->team;
            $prevPosition = $targetUser->position;

            // Demote user back to general community user
            $targetUser->role = 'User';
            $targetUser->type = 'User';
            $targetUser->team = null;
            $targetUser->position = null;
            $targetUser->tag = 'Community Attendee';
            $targetUser->show_on_website = false;
            $targetUser->save();

            // Remove associated team memberships
            TeamMembership::where('user_id', $targetUser->id)->delete();

            // Log action in audit log
            AuditLog::create([
                'actor_id' => $currentUser->id,
                'target_id' => $targetUser->id,
                'action' => 'member_removed_from_team',
                'details' => json_encode([
                    'removed_from_team' => $prevTeam,
                    'previous_position' => $prevPosition,
                    'new_role' => 'User',
                ]),
                'ip_address' => $request->ip(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$targetUser->name} has been removed from {$prevTeam} team.",
                'user' => $targetUser,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to remove member: ' . $e->getMessage()], 500);
        }
    }

    // ========================================================
    // EVENTS CRUD & REGISTRATIONS
    // ========================================================
    public function getEvents()
    {
        $events = \App\Models\Event::withCount('registrations')->orderBy('id', 'desc')->get();
        return response()->json(['success' => true, 'events' => $events]);
    }

    public function saveEvent(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|integer',
            'code' => 'required|string|max:50',
            'title' => 'required|string|max:200',
            'tagline' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string',
            'mode' => 'required|string',
            'participation' => 'required|string',
            'team_size' => 'nullable|string',
            'status' => 'required|string',
            'visibility' => 'nullable|string|in:Public,Private',
            'registration_open' => 'nullable|boolean',
            'start_date' => 'nullable|string',
            'end_date' => 'nullable|string',
            'time' => 'nullable|string',
            'duration' => 'nullable|string',
            'venue' => 'nullable|string',
            'location_details' => 'nullable|string',
            'seats' => 'nullable|string',
            'prize_pool' => 'nullable|string',
            'perks' => 'nullable|array',
            'tags' => 'nullable|array',
            'speakers' => 'nullable|array',
            'banner_img' => 'nullable|string',
            'registration_url' => 'nullable|string',
        ]);

        $currentUser = $request->user();
        $isUpdate = !empty($data['id']);

        if ($isUpdate) {
            if (!$currentUser->hasPermission('events.edit')) {
                return response()->json(['error' => 'Unauthorized. You do not have permission to edit events.'], 403);
            }
            $event = \App\Models\Event::findOrFail($data['id']);
            $event->update($data);
            $message = 'Event updated successfully.';
        } else {
            if (!$currentUser->hasPermission('events.create')) {
                return response()->json(['error' => 'Unauthorized. You do not have permission to create events.'], 403);
            }
            $data['created_by'] = $currentUser->id;
            $event = \App\Models\Event::create($data);
            $message = 'New event created successfully.';
        }

        return response()->json(['success' => true, 'message' => $message, 'event' => $event]);
    }

    public function deleteEvent(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('events.delete')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to delete events.'], 403);
        }

        $event = \App\Models\Event::findOrFail($id);
        $event->delete();
        return response()->json(['success' => true, 'message' => 'Event deleted successfully.']);
    }

    public function getEventRegistrations(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('events.registrations.view')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to view event registrations.'], 403);
        }

        $event = \App\Models\Event::findOrFail($id);

        $query = \App\Models\EventRegistration::where('event_id', $id)
            ->with(['user:id,name,email,phone,roll_no,course,branch,department,semester,college,university']);

        // Filter by Attendance Status (All, Present, Absent)
        if ($request->has('attendance_status') && !empty($request->input('attendance_status')) && $request->input('attendance_status') !== 'All') {
            $query->where('attendance_status', $request->input('attendance_status'));
        }

        // Search by attendee name, email, roll no, or QR token
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%")
                  ->orWhere('roll_no', 'like', "%{$search}%")
                  ->orWhere('qr_token', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 20);

        if ($perPage > 0) {
            $paginator = $query->orderBy('id', 'desc')->paginate($perPage);

            // Compute summary counts for this event
            $totalCount = \App\Models\EventRegistration::where('event_id', $id)->count();
            $presentCount = \App\Models\EventRegistration::where('event_id', $id)->where('attendance_status', 'Present')->count();
            $absentCount = \App\Models\EventRegistration::where('event_id', $id)->where('attendance_status', '!=', 'Present')->count();

            return response()->json([
                'success' => true,
                'event' => $event,
                'registrations' => $paginator->items(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
                'stats' => [
                    'total' => $totalCount,
                    'present' => $presentCount,
                    'absent' => $absentCount,
                ],
            ]);
        }

        $registrations = $query->orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'event' => $event,
            'registrations' => $registrations,
        ]);
    }

    /**
     * Mark Attendance by scanning / verifying QR Token.
     */
    public function markAttendance(Request $request)
    {
        $request->validate([
            'qr_token' => 'required|string',
            'status' => 'nullable|string|in:Present,Absent',
            'force' => 'nullable|boolean',
        ]);

        $currentUser = $request->user();
        if (!$currentUser || (!$currentUser->hasPermission('scanner.checkin') && !$currentUser->can_scan_qr)) {
            return response()->json([
                'success' => false,
                'error' => 'You do not have scanner permission to check-in attendees.',
            ], 403);
        }

        $qrToken = trim($request->input('qr_token'));
        $status = $request->input('status', 'Present');
        $force = (bool) $request->input('force', false);

        $registration = \App\Models\EventRegistration::where('qr_token', $qrToken)
            ->with(['event', 'user:id,name,email,phone,roll_no,course,branch,department,semester,college,university'])
            ->first();

        if (!$registration) {
            return response()->json([
                'success' => false,
                'scan_status' => 'INVALID_TOKEN',
                'error' => 'Invalid QR Code. No attendee registration found matching this pass token.',
            ], 404);
        }

        $wasAlreadyPresent = strtolower($registration->attendance_status ?? '') === 'present';

        // Check if QR pass is already checked in and user is not explicitly forcing re-checkin
        if ($wasAlreadyPresent && $status === 'Present' && !$force) {
            $formattedTime = $registration->attended_at ? $registration->attended_at->format('M d, Y h:i A') : 'earlier';
            return response()->json([
                'success' => false,
                'scan_status' => 'ALREADY_SCANNED',
                'already_scanned' => true,
                'message' => "Attendee already checked in! {$registration->user_name} was verified at {$formattedTime}.",
                'registration' => $registration,
            ], 409);
        }

        $registration->attendance_status = $status;
        $registration->attended_at = $status === 'Present' ? ($registration->attended_at ?: now()) : null;
        $registration->save();

        $actionWord = $status === 'Present' ? 'Checked in successfully' : 'Marked absent';

        return response()->json([
            'success' => true,
            'scan_status' => $status === 'Present' ? ($wasAlreadyPresent ? 'RE_CHECKED_IN' : 'SUCCESS_CHECK_IN') : 'ABSENT_MARKED',
            'already_scanned' => false,
            'message' => "{$actionWord}! Verified pass for {$registration->user_name} ({$registration->roll_no}).",
            'registration' => $registration,
        ]);
    }

    /**
     * Bulk mark attendance for all selected registrations in an event.
     */
    public function bulkMarkAttendance(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Present,Absent',
            'registration_ids' => 'nullable|array',
            'all' => 'nullable|boolean',
        ]);

        $status = $request->input('status');
        $query = \App\Models\EventRegistration::where('event_id', $id);

        if (!$request->input('all') && $request->has('registration_ids')) {
            $query->whereIn('id', $request->input('registration_ids'));
        }

        $affected = $query->update([
            'attendance_status' => $status,
            'attended_at' => $status === 'Present' ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully updated {$affected} registration(s) to {$status}.",
        ]);
    }

    /**
     * Delete an event registration record.
     */
    public function deleteRegistration(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('events.registrations.delete')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to delete registrations.'], 403);
        }

        $registration = \App\Models\EventRegistration::findOrFail($id);
        $registration->delete();

        return response()->json([
            'success' => true,
            'message' => 'Registration deleted successfully.',
        ]);
    }

    /**
     * Export all registrations for an event with rich student profile data.
     */
    public function exportEventRegistrations(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('events.registrations.export')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to export registrations.'], 403);
        }

        $event = \App\Models\Event::findOrFail($id);

        $query = \App\Models\EventRegistration::where('event_id', $id)
            ->with(['user:id,name,email,phone,roll_no,course,branch,department,semester,college,university']);

        if ($request->has('attendance_status') && !empty($request->input('attendance_status')) && $request->input('attendance_status') !== 'All') {
            $query->where('attendance_status', $request->input('attendance_status'));
        }

        if ($request->has('search') && !empty($request->input('search'))) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%")
                  ->orWhere('roll_no', 'like', "%{$search}%")
                  ->orWhere('qr_token', 'like', "%{$search}%");
            });
        }

        $registrations = $query->orderBy('id', 'asc')->get();

        return response()->json([
            'success' => true,
            'event' => $event,
            'registrations' => $registrations,
        ]);
    }

    // ========================================================
    // STORE PRODUCTS MANAGEMENT
    // ========================================================
    public function getProducts()
    {
        $products = \App\Models\StoreProduct::orderBy('id', 'desc')->get();
        return response()->json(['success' => true, 'products' => $products]);
    }

    public function saveProduct(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('store.manage')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to manage store products.'], 403);
        }

        $data = $request->validate([
            'id' => 'nullable|integer',
            'sku' => 'required|string|max:50',
            'name' => 'required|string|max:200',
            'category' => 'required|string',
            'price' => 'required|numeric',
            'original_price' => 'nullable|numeric',
            'stock' => 'required|integer',
            'status' => 'required|string',
            'description' => 'nullable|string',
            'sizes' => 'nullable|array',
            'image_url' => 'nullable|string',
        ]);

        if (!empty($data['id'])) {
            $product = \App\Models\StoreProduct::findOrFail($data['id']);
            $product->update($data);
            $message = 'Product updated successfully.';
        } else {
            $product = \App\Models\StoreProduct::create($data);
            $message = 'Product created successfully.';
        }

        return response()->json(['success' => true, 'message' => $message, 'product' => $product]);
    }

    public function deleteProduct(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('store.delete')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to delete store products.'], 403);
        }

        $product = \App\Models\StoreProduct::findOrFail($id);
        $product->delete();
        return response()->json(['success' => true, 'message' => 'Product deleted successfully.']);
    }

    // ========================================================
    // MEMBERSHIP APPLICATIONS & PROMOTIONS
    // ========================================================
    public function getApplications()
    {
        $applications = \App\Models\Application::orderBy('id', 'desc')->get();
        return response()->json(['success' => true, 'applications' => $applications]);
    }

    public function promoteApplication(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('applications.promote')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to promote applicants.'], 403);
        }

        $request->validate([
            'target_team' => 'required|string',
            'target_position' => 'nullable|string',
            'reviewer_notes' => 'nullable|string',
        ]);

        $app = \App\Models\Application::findOrFail($id);
        $targetTeam = $request->input('target_team');
        $targetPos = $request->input('target_position') ?: 'Core Member';

        // Check if user account exists or create one
        $user = \App\Models\User::where('email', $app->email)->first();
        if (!$user) {
            $user = \App\Models\User::create([
                'name' => $app->name,
                'email' => $app->email,
                'phone' => $app->phone,
                'roll_no' => $app->roll_no,
                'department' => $app->department,
                'course' => $app->course,
                'semester' => $app->semester,
                'role' => 'Team',
                'type' => 'Member',
                'team' => $targetTeam,
                'position' => $targetPos,
                'tag' => 'Active Builder',
            ]);
        } else {
            $user->role = 'Team';
            $user->type = 'Member';
            $user->team = $targetTeam;
            $user->position = $targetPos;
            $user->save();
        }

        // Add to team_memberships
        $teamModel = Team::where('name', $targetTeam)->first();
        if ($teamModel) {
            TeamMembership::updateOrInsert(
                ['user_id' => $user->id, 'team_id' => $teamModel->id],
                [
                    'designation' => 'Member',
                    'position' => $targetPos,
                    'is_primary' => true,
                    'updated_at' => now(),
                ]
            );
        }

        $app->status = 'Approved';
        $app->reviewer_notes = $request->input('reviewer_notes');
        $app->reviewed_by = $request->user()->id;
        $app->user_id = $user->id;
        $app->save();

        // Audit Log
        AuditLog::create([
            'actor_id' => $request->user()->id,
            'target_id' => $user->id,
            'action' => 'application_approved_promoted_to_team',
            'details' => json_encode([
                'applicant' => $app->name,
                'team' => $targetTeam,
                'position' => $targetPos,
            ]),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$app->name} was approved and promoted to {$targetTeam} as {$targetPos}.",
        ]);
    }

    public function rejectApplication(Request $request, $id)
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->hasPermission('applications.reject')) {
            return response()->json(['error' => 'Unauthorized. You do not have permission to reject applicants.'], 403);
        }

        $app = \App\Models\Application::findOrFail($id);
        $app->status = 'Rejected';
        $app->reviewer_notes = $request->input('reviewer_notes');
        $app->reviewed_by = $request->user()->id;
        $app->save();

        return response()->json(['success' => true, 'message' => 'Application marked as rejected.']);
    }

    // ========================================================
    // DYNAMIC APP SETTINGS & TAXONOMY MANAGEMENT
    // (Roles, Types, Positions, Teams, Colleges, Courses, Branches, Semesters)
    // ========================================================
    public function getSettings(Request $request)
    {
        $query = \App\Models\AppSetting::query();

        // Optional category filter to load only required taxonomy and prevent database overload
        if ($request->has('category') && !empty($request->input('category'))) {
            $cat = strtolower(trim($request->input('category')));
            // Normalize plurals or aliases
            $aliasMap = [
                'roles' => 'role',
                'types' => 'type',
                'positions' => 'position',
                'teams' => 'team',
                'universities' => 'university',
                'colleges' => 'college',
                'departments' => 'department',
                'courses' => 'course',
                'branches' => 'branch',
                'semesters' => 'semester',
            ];
            $type = $aliasMap[$cat] ?? $cat;
            $query->where('type', $type);
        }

        $settings = $query->orderBy('type', 'asc')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    public function saveSetting(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|integer',
            'type' => 'required|string|max:50',
            'name' => 'required|string|max:200',
            'group' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        if (!empty($data['id'])) {
            $setting = \App\Models\AppSetting::findOrFail($data['id']);
            $setting->update($data);
            $message = 'Option updated successfully.';
        } else {
            $data['sort_order'] = $data['sort_order'] ?? (\App\Models\AppSetting::where('type', $data['type'])->max('sort_order') + 1);
            $setting = \App\Models\AppSetting::create($data);
            $message = 'Option created successfully.';
        }

        // Keep AcademicOption in sync if it's an academic type
        if (in_array($setting->type, ['university', 'college', 'department', 'course', 'branch', 'semester'])) {
            \App\Models\AcademicOption::updateOrInsert(
                ['category' => $setting->type, 'value' => $setting->name],
                [
                    'sort_order' => $setting->sort_order,
                    'is_active' => $setting->is_active,
                    'updated_at' => now(),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'setting' => $setting,
        ]);
    }

    public function deleteSetting($id)
    {
        $setting = \App\Models\AppSetting::findOrFail($id);
        
        // Also remove from AcademicOption if applicable
        if (in_array($setting->type, ['university', 'college', 'department', 'course', 'branch', 'semester'])) {
            \App\Models\AcademicOption::where('category', $setting->type)
                ->where('value', $setting->name)
                ->delete();
        }

        $setting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Option removed successfully.',
        ]);
    }

    /**
     * Reorder settings / taxonomies via drag-and-drop.
     * Expects payload: { ordered_ids: [5, 2, 9, ...] }
     */
    public function reorderSettings(Request $request)
    {
        $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'integer',
        ]);

        $orderedIds = $request->input('ordered_ids');

        foreach ($orderedIds as $index => $id) {
            $newOrder = $index + 1;
            $setting = \App\Models\AppSetting::find($id);
            if ($setting) {
                $setting->update(['sort_order' => $newOrder]);

                if (in_array($setting->type, ['university', 'college', 'department', 'course', 'branch', 'semester'])) {
                    \App\Models\AcademicOption::where('category', $setting->type)
                        ->where('value', $setting->name)
                        ->update(['sort_order' => $newOrder]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings order updated successfully.',
        ]);
    }

    /**
     * Reorder website team members via drag-and-drop.
     * Expects payload: { ordered_ids: [1, 3, 4, ...] }
     */
    public function reorderMembers(Request $request)
    {
        $request->validate([
            'ordered_ids' => 'required|array',
            'ordered_ids.*' => 'integer',
        ]);

        $orderedIds = $request->input('ordered_ids');

        foreach ($orderedIds as $index => $id) {
            $newOrder = $index + 1;
            \App\Models\User::where('id', $id)->update(['website_order' => $newOrder]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Website member order updated successfully.',
        ]);
    }

    /**
     * Get detailed record of a single user (personal, academic, event registrations, orders).
     */
    public function getUserDetails($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        // Get event registrations with event info
        $registrations = \App\Models\EventRegistration::where('user_id', $user->id)
            ->with('event')
            ->orderBy('id', 'desc')
            ->get();

        $attendedCount = $registrations->where('attendance_status', 'Present')->count();
        $registeredCount = $registrations->count();

        // Get store orders
        $orders = \App\Models\StoreOrder::where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'roll_no' => $user->roll_no,
                'department' => $user->department,
                'branch' => $user->branch,
                'course' => $user->course,
                'semester' => $user->semester,
                'college' => $user->college,
                'university' => $user->university,
                'bio' => $user->bio,
                'avatar' => $user->avatar,
                'linkedin' => $user->linkedin,
                'github' => $user->github,
                'role' => $user->role,
                'type' => $user->type,
                'status' => $user->status ?? 'active',
                'team' => $user->team,
                'position' => $user->position,
                'tag' => $user->tag,
                'show_on_website' => (bool)$user->show_on_website,
                'website_order' => $user->website_order,
                'profile_completed' => (bool)$user->profile_completed,
                'created_at' => $user->created_at ? $user->created_at->format('M d, Y h:i A') : null,
                'updated_at' => $user->updated_at ? $user->updated_at->format('M d, Y h:i A') : null,
            ],
            'stats' => [
                'events_registered' => $registeredCount,
                'events_attended' => $attendedCount,
                'orders_count' => $orders->count(),
                'total_spent' => $orders->sum('total_amount'),
            ],
            'registrations' => $registrations,
            'orders' => $orders,
        ]);
    }

    // ========================================================
    // RBAC & ROLE PERMISSIONS MANAGEMENT
    // ========================================================
    public function getRolePermissions(Request $request)
    {
        $roles = \App\Models\AppSetting::where('type', 'role')
            ->where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->pluck('name')
            ->toArray();

        $defaultRoles = ['Admin', 'Lead', 'Member', 'User'];
        $allRoles = array_values(array_unique(array_merge($defaultRoles, $roles)));

        // Predefined System Permissions Catalog
        $permissionsCatalog = [
            [
                'module' => 'Events Management',
                'description' => 'Create, edit, and orchestrate technical sprints and workshops',
                'permissions' => [
                    ['key' => 'events.view', 'label' => 'View Events', 'description' => 'Access and browse events listing'],
                    ['key' => 'events.create', 'label' => 'Create Events', 'description' => 'Publish new events and hackathons'],
                    ['key' => 'events.edit', 'label' => 'Edit Events', 'description' => 'Modify schedules, venues, and descriptions'],
                    ['key' => 'events.delete', 'label' => 'Delete Events', 'description' => 'Permanently remove events from ecosystem'],
                    ['key' => 'events.registrations.view', 'label' => 'View Registrations', 'description' => 'Access attendee rosters and attendance records'],
                    ['key' => 'events.registrations.export', 'label' => 'Export Attendee CSV', 'description' => 'Download attendee spreadsheet with academic profiling'],
                    ['key' => 'events.registrations.delete', 'label' => 'Delete Registrations', 'description' => 'Remove attendee passes and entries'],
                ],
            ],
            [
                'module' => 'QR Check-in & Scanner',
                'description' => 'Event gate pass verification and attendee check-in terminal',
                'permissions' => [
                    ['key' => 'scanner.access', 'label' => 'Access Terminal', 'description' => 'Open camera terminal and manual token check-in'],
                    ['key' => 'scanner.checkin', 'label' => 'Check-in Attendees', 'description' => 'Verify passes and mark attendees as Present'],
                    ['key' => 'scanner.override', 'label' => 'Override Duplicate Pass', 'description' => 'Force admission for re-entry or duplicate warnings'],
                ],
            ],
            [
                'module' => 'Store & Merchandise',
                'description' => 'Swag inventory, gear orders, and pricing configuration',
                'permissions' => [
                    ['key' => 'store.view', 'label' => 'View Products', 'description' => 'Browse internal store inventory'],
                    ['key' => 'store.manage', 'label' => 'Manage Inventory', 'description' => 'Create and modify merchandise SKUs and prices'],
                    ['key' => 'store.delete', 'label' => 'Delete Products', 'description' => 'Remove products from store inventory'],
                ],
            ],
            [
                'module' => 'Team & Community Users',
                'description' => 'Manage user accounts, roles, and hierarchical rankings',
                'permissions' => [
                    ['key' => 'members.view', 'label' => 'View Team Members', 'description' => 'Inspect internal team lists'],
                    ['key' => 'members.reorder', 'label' => 'Reorder Leadership', 'description' => 'Drag and drop website public leadership rankings'],
                    ['key' => 'users.view', 'label' => 'View Community Users', 'description' => 'Browse registered student accounts'],
                    ['key' => 'users.details', 'label' => 'Inspect User Dossier', 'description' => 'Access comprehensive profile and order histories'],
                    ['key' => 'users.edit', 'label' => 'Edit User Hierarchy', 'description' => 'Change roles, tiers, and assign team wings'],
                    ['key' => 'users.block', 'label' => 'Block / Unblock Users', 'description' => 'Toggle user account status between active and blocked'],
                ],
            ],
            [
                'module' => 'Applications & Recruitment',
                'description' => 'Core team recruitment pipeline and candidate promotions',
                'permissions' => [
                    ['key' => 'applications.view', 'label' => 'View Applications', 'description' => 'Review incoming candidate applications'],
                    ['key' => 'applications.promote', 'label' => 'Promote Candidates', 'description' => 'Accept and assign applicants into teams'],
                    ['key' => 'applications.reject', 'label' => 'Reject Applications', 'description' => 'Decline recruitment applications'],
                ],
            ],
            [
                'module' => 'System & Taxonomies',
                'description' => 'Dynamic settings, taxonomy options, and role management',
                'permissions' => [
                    ['key' => 'settings.manage', 'label' => 'Dynamic Taxonomies', 'description' => 'Manage Colleges, Branches, Semesters, and Teams'],
                    ['key' => 'rbac.manage', 'label' => 'Manage Roles & RBAC', 'description' => 'Configure security matrix and module access rights'],
                ],
            ],
        ];

        // Fetch stored assignments from role_permissions table
        $assigned = \App\Models\RolePermission::all()
            ->groupBy('role_name')
            ->map(fn($group) => $group->pluck('permission_key')->toArray())
            ->toArray();

        // If table is newly initialized, assign default presets
        if (empty($assigned)) {
            $allKeys = [];
            foreach ($permissionsCatalog as $mod) {
                foreach ($mod['permissions'] as $p) {
                    $allKeys[] = $p['key'];
                }
            }

            // Admin gets all
            $assigned['Admin'] = $allKeys;

            // Lead gets operational permissions
            $assigned['Lead'] = [
                'events.view', 'events.create', 'events.edit', 'events.registrations.view', 'events.registrations.export',
                'scanner.access', 'scanner.checkin',
                'store.view', 'store.manage',
                'members.view', 'members.reorder', 'users.view', 'users.details',
                'applications.view', 'applications.promote', 'applications.reject',
            ];

            // Member gets read permissions
            $assigned['Member'] = [
                'events.view', 'events.registrations.view',
                'scanner.access', 'scanner.checkin',
                'store.view',
                'members.view',
            ];

            // User gets basic portal
            $assigned['User'] = ['events.view'];

            // Seed into DB for persistence
            foreach ($assigned as $roleName => $keys) {
                foreach ($keys as $k) {
                    \App\Models\RolePermission::firstOrCreate([
                        'role_name' => $roleName,
                        'permission_key' => $k,
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'roles' => $allRoles,
            'catalog' => $permissionsCatalog,
            'role_permissions' => $assigned,
        ]);
    }

    public function saveRolePermissions(Request $request)
    {
        $request->validate([
            'role_name' => 'required|string|max:50',
            'permissions' => 'present|array',
        ]);

        $roleName = $request->input('role_name');
        $permissions = $request->input('permissions');

        // Delete existing mappings for this role
        \App\Models\RolePermission::where('role_name', $roleName)->delete();

        // Insert new selected permissions
        $records = [];
        $now = now();
        foreach ($permissions as $permKey) {
            $records[] = [
                'role_name' => $roleName,
                'permission_key' => $permKey,
                'module' => explode('.', $permKey)[0] ?? 'general',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (!empty($records)) {
            \App\Models\RolePermission::insert($records);
        }

        return response()->json([
            'success' => true,
            'message' => "Permissions matrix for role '{$roleName}' successfully updated.",
            'role_name' => $roleName,
            'permissions' => $permissions,
        ]);
    }
}
