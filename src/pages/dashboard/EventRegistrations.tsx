import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  QrCode,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Trash2
} from "lucide-react";
import { apiFetch, getStoredToken, getStoredUser } from "@/config/api";

interface EventInfo {
  id: number;
  code: string;
  title: string;
  type: string;
  mode: string;
  start_date?: string;
  time?: string;
  venue?: string;
  status?: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  roll_no?: string;
  course?: string;
  branch?: string;
  department?: string;
  semester?: string;
  college?: string;
  university?: string;
}

interface Registration {
  id: number;
  event_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone?: string;
  roll_no?: string;
  college?: string;
  attendance_status: string;
  attended_at?: string;
  qr_token: string;
  created_at: string;
  user?: UserProfile;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface EventStats {
  total: number;
  present: number;
  absent: number;
}

export default function EventRegistrations() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Authentication & RBAC
  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token) {
      navigate("/login");
      return;
    }
    if (user && user.role === "User" && !user.is_admin && !user.is_lead) {
      navigate("/dashboard/events");
    }
  }, [navigate]);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
  });
  const [stats, setStats] = useState<EventStats>({ total: 0, present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string>("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Present" | "Absent">("All");

  // Multi-selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Single QR code preview modal
  const [inspectingQr, setInspectingQr] = useState<Registration | null>(null);

  // Notification helper
  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 4000);
  };

  const [currentUser, setCurrentUser] = useState<any | null>(() => getStoredUser());

  const hasPermission = useCallback((permKey: string) => {
    if (!currentUser) return false;
    if (currentUser.role === "Admin" || currentUser.is_admin) return true;
    if (Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(permKey);
    }
    return false;
  }, [currentUser]);

  const canScanQR = useMemo(() => {
    if (!currentUser) return false;
    return hasPermission("scanner.checkin") || hasPermission("scanner.access") || !!currentUser.can_scan_qr;
  }, [currentUser, hasPermission]);

  // Auth Verification
  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (!token) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);

    // Refresh user permissions from server
    apiFetch("/user").then(async (res) => {
      if (res.ok) {
        const u = await res.json();
        setCurrentUser(u);
        const canView = u.role === "Admin" || u.is_admin || (Array.isArray(u.permissions) && u.permissions.includes("events.registrations.view"));
        if (!canView) {
          navigate("/dashboard/events");
        }
      }
    }).catch(() => {});
  }, [navigate]);

  // Load Registrations Page
  const loadRegistrations = useCallback(
    async (page: number = 1, search: string = searchQuery, status: string = statusFilter) => {
      if (!eventId) return;
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          per_page: "25",
        });
        if (search.trim()) queryParams.set("search", search.trim());
        if (status !== "All") queryParams.set("attendance_status", status);

        const res = await apiFetch(`/admin/events/${eventId}/registrations?${queryParams.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
          if (data.event) setEvent(data.event);
          setRegistrations(data.registrations || []);
          if (data.pagination) setPagination(data.pagination);
          if (data.stats) setStats(data.stats);
        } else {
          showNotification(data.error || "Failed to load event registrations.");
        }
      } catch {
        showNotification("Network error loading event attendees.");
      } finally {
        setLoading(false);
      }
    },
    [eventId, searchQuery, statusFilter]
  );

  useEffect(() => {
    loadRegistrations(1, searchQuery, statusFilter);
  }, [loadRegistrations]);

  // Toggle individual attendee attendance
  const toggleAttendance = async (reg: Registration) => {
    const isCurrentlyPresent = (reg.attendance_status || "").toLowerCase() === "present";
    const nextStatus = isCurrentlyPresent ? "Absent" : "Present";

    try {
      const res = await apiFetch("/admin/events/attendance", {
        method: "POST",
        body: JSON.stringify({
          qr_token: reg.qr_token,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `Marked as ${nextStatus}`);
        setRegistrations((prev) =>
          prev.map((item) =>
            item.id === reg.id ? { ...item, attendance_status: nextStatus } : item
          )
        );
        setStats((prev) => ({
          ...prev,
          present: isCurrentlyPresent ? Math.max(0, prev.present - 1) : prev.present + 1,
          absent: isCurrentlyPresent ? prev.absent + 1 : Math.max(0, prev.absent - 1),
        }));
      } else {
        showNotification(data.error || "Failed to update attendance status.");
      }
    } catch {
      showNotification("Network error updating attendance.");
    }
  };

  // Single Delete Registration
  const handleDeleteRegistration = async (reg: Registration) => {
    if (!confirm(`Are you sure you want to remove ${reg.user_name} from this event?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/admin/events/registrations/${reg.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || "Registration deleted.");
        setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
        setSelectedIds((prev) => prev.filter((id) => id !== reg.id));
        setStats((prev) => {
          const isPresent = (reg.attendance_status || "").toLowerCase() === "present";
          return {
            total: Math.max(0, prev.total - 1),
            present: isPresent ? Math.max(0, prev.present - 1) : prev.present,
            absent: !isPresent ? Math.max(0, prev.absent - 1) : prev.absent,
          };
        });
        setPagination((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      } else {
        showNotification(data.error || "Failed to delete registration.");
      }
    } catch {
      showNotification("Network error deleting registration.");
    }
  };

  // Bulk Attendance Trigger
  const handleBulkAttendance = async (statusToSet: "Present" | "Absent") => {
    if (selectedIds.length === 0) {
      alert("Please select at least one attendee first.");
      return;
    }

    if (!confirm(`Mark ${selectedIds.length} selected attendee(s) as ${statusToSet}?`)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await apiFetch(`/admin/events/${eventId}/bulk-attendance`, {
        method: "POST",
        body: JSON.stringify({
          status: statusToSet,
          registration_ids: selectedIds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `Bulk attendance updated to ${statusToSet}.`);
        setSelectedIds([]);
        loadRegistrations(pagination.current_page, searchQuery, statusFilter);
      } else {
        showNotification(data.error || "Failed to update bulk attendance.");
      }
    } catch {
      showNotification("Network error updating bulk attendance.");
    } finally {
      setBulkProcessing(false);
    }
  };

  // Export Attendees to CSV (with full student profile details: Course, Branch, Dept, Semester, College, University)
  const [exporting, setExporting] = useState(false);

  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Fetch full event registrations without pagination constraints
      const res = await apiFetch(`/admin/events/${eventId}/registrations/export?attendance_status=${statusFilter}`);
      const data = await res.json();
      
      const records: Registration[] = (res.ok && data.registrations) ? data.registrations : registrations;

      if (!records || records.length === 0) {
        alert("No attendee records available to export.");
        return;
      }

      const headers = [
        "Registration ID",
        "Student Name",
        "Email",
        "Phone",
        "Roll No",
        "Course",
        "Branch",
        "Department",
        "Semester",
        "College / Campus",
        "University",
        "Attendance Status",
        "Attended At",
        "Unique QR Token",
        "Registration Date"
      ];

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).trim().replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = records.map((r) => {
        const u = r.user;
        const studentName = r.user_name || u?.name || "";
        const email = r.user_email || u?.email || "";
        const phone = r.user_phone || u?.phone || "";
        const rollNo = r.roll_no || u?.roll_no || "";
        const course = u?.course || "";
        const branch = u?.branch || "";
        const department = u?.department || "";
        const semester = u?.semester || "";
        const college = r.college || u?.college || "";
        const university = u?.university || "";
        const status = r.attendance_status || "Absent";
        const attendedAt = r.attended_at || "";
        const qrToken = r.qr_token || "";
        const regDate = r.created_at ? new Date(r.created_at).toLocaleString() : "";

        return [
          r.id,
          escapeCSV(studentName),
          escapeCSV(email),
          escapeCSV(phone),
          escapeCSV(rollNo),
          escapeCSV(course),
          escapeCSV(branch),
          escapeCSV(department),
          escapeCSV(semester),
          escapeCSV(college),
          escapeCSV(university),
          escapeCSV(status),
          escapeCSV(attendedAt),
          escapeCSV(qrToken),
          escapeCSV(regDate),
        ];
      });

      // Add UTF-8 BOM so Excel automatically recognizes encoding and special characters
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${(event?.code || "EVENT").replace(/\s+/g, "_")}_${(event?.title || "Attendees").replace(/[^a-zA-Z0-9_-]/g, "_")}_attendees.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification(`Exported ${records.length} attendee record(s) successfully.`);
    } catch {
      showNotification("Failed to export attendee records.");
    } finally {
      setExporting(false);
    }
  };

  // Selection toggles
  const isAllSelected = useMemo(() => {
    return (
      registrations.length > 0 &&
      registrations.every((r) => selectedIds.includes(r.id))
    );
  }, [registrations, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(registrations.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans pb-16">
      {/* Top Banner & Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/events"
              className="p-2 border border-zinc-800 hover:border-white bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors"
              title="Return to Events"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                  {event?.code || "CZ-EV" + eventId}
                </span>
                <span className="text-[11px] uppercase font-bold text-emerald-400">
                  {event?.type || "Event"}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-white mt-0.5">
                {event?.title || "Event Attendee Registrations"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {hasPermission("events.registrations.export") && (
              <button
                type="button"
                disabled={exporting}
                onClick={exportToCSV}
                className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-300 hover:text-white rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Export attendees to CSV spreadsheet"
              >
                {exporting ? (
                  <RefreshCw size={14} className="animate-spin text-emerald-400" />
                ) : (
                  <FileSpreadsheet size={14} className="text-emerald-400" />
                )}
                <span>{exporting ? "Exporting..." : "Export CSV"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => loadRegistrations(pagination.current_page, searchQuery, statusFilter)}
              className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-850 text-xs font-semibold text-zinc-300 hover:text-white rounded flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Action Feedback */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider rounded shadow-2xl border border-zinc-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {actionMessage}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-zinc-800 bg-zinc-950 rounded-xl">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">
              TOTAL REGISTRATIONS
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-white">{stats.total}</span>
              <span className="text-xs font-mono text-zinc-400">All Attendees</span>
            </div>
          </div>

          <div className="p-4 border border-emerald-900/40 bg-emerald-950/10 rounded-xl">
            <span className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-mono block">
              CONFIRMED PRESENT
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-emerald-400">{stats.present}</span>
              <span className="text-xs font-mono text-emerald-500/80">
                {stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}% Turnout` : "0%"}
              </span>
            </div>
          </div>

          <div className="p-4 border border-rose-900/30 bg-rose-950/10 rounded-xl">
            <span className="text-[10px] text-rose-400/80 uppercase tracking-widest font-mono block">
              ABSENT / UNVERIFIED
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black text-rose-400">{stats.absent}</span>
              <span className="text-xs font-mono text-rose-400/70">Awaiting QR Verification</span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Bulk Action Toolbar */}
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search name, email, roll no, token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadRegistrations(1, searchQuery, statusFilter);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 rounded outline-none focus:border-zinc-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    loadRegistrations(1, "", statusFilter);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 p-1 rounded">
              {(["All", "Present", "Absent"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setStatusFilter(s);
                    loadRegistrations(1, searchQuery, s);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    statusFilter === s
                      ? "bg-white text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {canScanQR && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 mr-1">
                {selectedIds.length} Selected
              </span>
              <button
                type="button"
                disabled={selectedIds.length === 0 || bulkProcessing}
                onClick={() => handleBulkAttendance("Present")}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <CheckCircle size={13} />
                <span>Mark Present</span>
              </button>
              <button
                type="button"
                disabled={selectedIds.length === 0 || bulkProcessing}
                onClick={() => handleBulkAttendance("Absent")}
                className="px-3 py-1.5 border border-zinc-800 hover:border-rose-500/50 bg-zinc-900 hover:bg-rose-500/10 text-rose-400 text-xs font-bold uppercase rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              >
                <XCircle size={13} />
                <span>Mark Absent</span>
              </button>
            </div>
          )}
        </div>

        {/* Attendee Registrations Table */}
        <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  {canScanQR && (
                    <th className="p-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-zinc-400 hover:text-white"
                        title={isAllSelected ? "Deselect All" : "Select All"}
                      >
                        {isAllSelected ? (
                          <CheckSquare size={16} className="text-white" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="p-3">Attendee Name & Email</th>
                  <th className="p-3">Roll No & College</th>
                  <th className="p-3">QR Ticket Token</th>
                  <th className="p-3">Attendance Status</th>
                  <th className="p-3">Registered On</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={canScanQR ? 7 : 6} className="p-16 text-center text-zinc-400 font-mono">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw size={16} className="animate-spin text-white" />
                        <span>Loading registrations...</span>
                      </div>
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={canScanQR ? 7 : 6} className="p-16 text-center text-zinc-500 font-mono text-xs">
                      No attendee registrations found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => {
                    const isPresent = (reg.attendance_status || "").toLowerCase() === "present";
                    const isSelected = selectedIds.includes(reg.id);

                    return (
                      <tr
                        key={reg.id}
                        className={`hover:bg-zinc-900/50 transition-colors ${
                          isSelected ? "bg-zinc-900/70" : ""
                        }`}
                      >
                        {canScanQR && (
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(reg.id)}
                              className="text-zinc-500 hover:text-white"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-white" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </td>
                        )}

                        {/* Attendee Info */}
                        <td className="p-3">
                          <span className="font-bold text-white block text-xs">{reg.user_name}</span>
                          <span className="text-[11px] text-zinc-400 block font-mono">{reg.user_email}</span>
                          {reg.user_phone && (
                            <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">
                              {reg.user_phone}
                            </span>
                          )}
                        </td>

                        {/* Academic / Roll Info */}
                        <td className="p-3 font-mono text-xs text-zinc-300">
                          <span className="font-bold text-white block">
                            {reg.roll_no || reg.user?.roll_no || "N/A"}
                          </span>
                          <span className="text-[10px] text-zinc-400 block truncate max-w-[220px]">
                            {[
                              reg.user?.course,
                              reg.user?.branch,
                              reg.user?.semester,
                            ]
                              .filter(Boolean)
                              .join(" · ") || (reg.college || "Autonomous / CGC")}
                          </span>
                          {reg.user?.college && (
                            <span className="text-[9px] text-zinc-500 block truncate max-w-[220px]">
                              {reg.user.college}
                            </span>
                          )}
                        </td>

                        {/* QR Code / Pass Token */}
                        <td className="p-3 font-mono">
                          <button
                            type="button"
                            onClick={() => setInspectingQr(reg)}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded text-[11px] inline-flex items-center gap-1.5 group transition-colors"
                            title="Click to view QR Pass"
                          >
                            <QrCode size={13} className="text-zinc-400 group-hover:text-white" />
                            <span>{reg.qr_token || `REG-${reg.id}-CZ`}</span>
                          </button>
                        </td>

                        {/* Status Badge */}
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1.5 border ${
                              isPresent
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPresent ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                            />
                            <span>{isPresent ? "Present" : "Absent"}</span>
                          </span>
                          {reg.attended_at && (
                            <span className="text-[9px] text-zinc-500 block font-mono mt-0.5">
                              {reg.attended_at}
                            </span>
                          )}
                        </td>

                        {/* Registration Date */}
                        <td className="p-3 font-mono text-[11px] text-zinc-400">
                          {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : "-"}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {hasPermission("scanner.checkin") && (
                              <button
                                type="button"
                                onClick={() => toggleAttendance(reg)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase rounded border transition-colors ${
                                  isPresent
                                    ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white"
                                    : "border-emerald-500/80 bg-emerald-500 text-black hover:bg-emerald-400 font-extrabold"
                                }`}
                              >
                                {isPresent ? "Mark Absent" : "Mark Present"}
                              </button>
                            )}

                            {hasPermission("events.registrations.delete") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRegistration(reg)}
                                className="p-1.5 border border-zinc-800 hover:border-rose-500/50 bg-zinc-900 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                                title="Delete registration"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-zinc-900/40 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-zinc-400 font-mono text-xs">
              Showing{" "}
              <span className="font-bold text-white">
                {pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-white">
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
              </span>{" "}
              of <span className="font-bold text-white">{pagination.total}</span> registered attendees
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.current_page <= 1 || loading}
                onClick={() => loadRegistrations(pagination.current_page - 1, searchQuery, statusFilter)}
                className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed rounded flex items-center gap-1 text-xs font-medium transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <span className="px-2 text-xs font-mono text-zinc-400">
                Page <strong className="text-white">{pagination.current_page}</strong> of{" "}
                <strong className="text-white">{pagination.last_page || 1}</strong>
              </span>
              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page || loading}
                onClick={() => loadRegistrations(pagination.current_page + 1, searchQuery, statusFilter)}
                className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed rounded flex items-center gap-1 text-xs font-medium transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* QR PASS INSPECTION POPUP (TICKET STUB DESIGN - FIT IN SCREEN VH) */}
      {inspectingQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div data-lenis-prevent className="relative w-full max-w-[340px] max-h-[92vh] flex flex-col filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setInspectingQr(null)}
              className="absolute -top-2.5 -right-2.5 z-30 w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white flex items-center justify-center transition-colors shadow-lg"
            >
              <X size={14} />
            </button>

            <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl font-mono flex flex-col max-h-[92vh]">
              {/* Top Banner */}
              <div className="px-4 py-3 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-b border-zinc-850/60 relative shrink-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400">
                      Attendee Pass
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.5 border border-zinc-800 rounded">
                    {event?.code || "EVENT"}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold uppercase text-white truncate">
                  {inspectingQr.user_name}
                </h3>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{inspectingQr.user_email}</p>
              </div>

              {/* Scrollable Middle Container */}
              <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {/* QR Stub */}
                <div className="py-3 px-3 bg-zinc-950 text-center flex flex-col items-center justify-center">
                  <div className="p-2.5 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.06)] border-2 border-zinc-900 inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        inspectingQr.qr_token || `CZ-EV${inspectingQr.event_id}-U${inspectingQr.user_id}`
                      )}`}
                      alt="Ticket QR Code"
                      className="w-32 h-32 sm:w-36 sm:h-36 mx-auto block rounded"
                    />
                  </div>

                  <div className="mt-2">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">
                      Ticket Pass Code
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-300 bg-zinc-900 px-2.5 py-0.5 border border-zinc-800 rounded-full inline-block mt-0.5">
                      {inspectingQr.qr_token || `REG-${inspectingQr.id}-CZ`}
                    </span>
                  </div>
                </div>

                {/* Ticket Notches & Perforation */}
                <div className="relative flex items-center justify-between px-0 my-0.5 shrink-0">
                  <div className="w-5 h-5 -ml-2.5 rounded-full bg-black border-r border-zinc-800 z-10 shadow-inner" />
                  <div className="flex-1 border-b-2 border-dashed border-zinc-800 mx-1.5" />
                  <div className="w-5 h-5 -mr-2.5 rounded-full bg-black border-l border-zinc-800 z-10 shadow-inner" />
                </div>

                {/* Bottom Details */}
                <div className="p-4 bg-zinc-950 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase font-mono block">Roll No</span>
                      <span className="font-bold text-white text-[11px] truncate block leading-tight">
                        {inspectingQr.roll_no || inspectingQr.user?.roll_no || "N/A"}
                      </span>
                    </div>

                    <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase font-mono block">Attendance</span>
                      <div className="mt-0.5">
                        <span
                          className={`px-1.5 py-0.5 text-[8px] uppercase font-bold tracking-wider rounded inline-flex items-center gap-1 border ${
                            inspectingQr.attendance_status === "Present"
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/40"
                              : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full ${inspectingQr.attendance_status === "Present" ? "bg-emerald-400" : "bg-rose-400"}`} />
                          <span>{inspectingQr.attendance_status === "Present" ? "Present" : "Absent"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-900">
                    <span className="text-[8px] text-zinc-500 uppercase font-mono block">Academic Profile</span>
                    <span className="text-zinc-200 text-[10px] block truncate">
                      {[
                        inspectingQr.user?.course,
                        inspectingQr.user?.branch,
                        inspectingQr.user?.semester,
                      ]
                        .filter(Boolean)
                        .join(" • ") || (inspectingQr.college || "Autonomous / CGC")}
                    </span>
                    {inspectingQr.user?.college && (
                      <span className="text-[9px] text-zinc-500 block truncate mt-0.5">
                        {inspectingQr.user.college}
                      </span>
                    )}
                  </div>

                  {/* Barcode graphic strip */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center h-5 px-1.5 bg-white/5 rounded opacity-75 overflow-hidden">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-full bg-zinc-400 ${i % 3 === 0 ? "w-1" : i % 5 === 0 ? "w-1.5" : "w-0.5"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-3 bg-zinc-950 border-t border-zinc-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setInspectingQr(null)}
                  className="w-full py-2 bg-white hover:bg-zinc-200 text-black uppercase text-[11px] font-bold rounded-lg transition-all shadow-md"
                >
                  Close Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
