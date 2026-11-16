import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  Users,
  Shield,
  FileText,
  UserCheck,
  UserMinus,
  Plus,
  Search,
  LogOut,
  ExternalLink,
  Menu,
  X,
  RefreshCw,
  Check,
  Settings,
  Trash2,
  ShoppingCart,
  User,
  Save,
  QrCode,
  GripVertical,
  Eye,
  GraduationCap,
  Building,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Edit,
  Ban,
  CheckCircle,
  KeyRound,
  EyeOff,
  Upload,
  Camera,
  Loader2,
} from "lucide-react";
import { apiFetch, ACADEMIC_OPTIONS_URL, logoutUser, getStoredToken, getStoredUser, storeAuthSession, invalidateApiCache } from "@/config/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";
import QRScannerTab from "@/components/dashboard/QRScannerTab";
import RBACTab from "@/components/dashboard/RBACTab";

type TabKey =
  | "overview"
  | "events"
  | "scanner"
  | "store"
  | "members"
  | "users"
  | "applications"
  | "rbac"
  | "settings"
  | "cart"
  | "profile";

interface CurrentUserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  roll_no?: string;
  department?: string;
  branch?: string;
  course?: string;
  semester?: string;
  college?: string;
  university?: string;
  role: "Admin" | "Team" | "User";
  type: "Admin" | "Lead" | "Member" | "User";
  status?: "active" | "blocked" | string;
  team?: string | null;
  position?: string | null;
  tag?: string | null;
  bio?: string | null;
  avatar?: string | null;
  linkedin?: string | null;
  github?: string | null;
  is_admin?: boolean;
  is_lead?: boolean;
  can_scan_qr?: boolean;
  rbac_role?: string;
  permissions?: string[];
}

interface UserRegisteredEvent {
  registration_id: number;
  event_id: number;
  event_code: string;
  event_title: string;
  event_type: string;
  mode: string;
  venue: string;
  start_date?: string;
  status: string;
  registration_status: string;
  attendance_status?: string;
  attended_at?: string;
  qr_token?: string;
  registered_at?: string;
}

interface UserStoreOrder {
  id: number;
  order_number: string;
  product_name: string;
  product_sku?: string;
  category?: string;
  size?: string;
  price: number;
  quantity: number;
  total_amount: number;
  status: string;
  pickup_token?: string;
  created_at?: string;
}

interface UserDashboardSummary {
  stats: {
    events_attended: number;
    events_registered: number;
    orders_count: number;
    total_spent: number;
  };
  events: UserRegisteredEvent[];
  orders: UserStoreOrder[];
}

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  roll_no?: string;
  department?: string;
  branch?: string;
  course?: string;
  semester?: string;
  college?: string;
  university?: string;
  role: "Admin" | "Team" | "User";
  type: "Admin" | "Lead" | "Member" | "User";
  status?: "active" | "blocked" | string;
  team?: string | null;
  position?: string | null;
  tag?: string | null;
  show_on_website?: boolean;
  can_scan_qr?: boolean;
  website_order?: number;
  avatar?: string | null;
  linkedin?: string | null;
  github?: string | null;
  created_at?: string;
}

interface EventSpeakerRecord {
  name: string;
  role: string;
  companyOrOrg?: string;
  avatar?: string;
}

interface EventRecord {
  id: number;
  code: string;
  title: string;
  tagline?: string;
  description?: string;
  type: "Hackathon" | "Bootcamp" | "Workshop" | "Challenge" | "Contest" | "Code Race";
  mode: "Offline" | "Online" | "Hybrid";
  participation: "Single" | "Team" | "Single or Team";
  team_size?: string;
  status: "REGISTRATION OPEN" | "UPCOMING" | "LIVE NOW" | "CONCLUDED";
  visibility?: "Public" | "Private";
  registration_open?: boolean;
  start_date?: string;
  end_date?: string;
  time?: string;
  duration?: string;
  venue?: string;
  location_details?: string;
  seats?: string;
  prize_pool?: string;
  perks?: string[];
  tags?: string[];
  speakers?: EventSpeakerRecord[];
  banner_img?: string;
  registration_url?: string;
  registrations_count?: number;
}

interface StoreProductRecord {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  original_price?: number;
  stock: number;
  status: "Active" | "Draft" | "Out of Stock";
  description?: string;
  sizes?: string[];
  image_url?: string;
}

interface ApplicationRecord {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  roll_no?: string;
  department?: string;
  course?: string;
  semester?: string;
  target_team: string;
  target_position: string;
  portfolio_url?: string;
  github_url?: string;
  statement_of_purpose?: string;
  status: "Pending" | "Shortlisted" | "Approved" | "Rejected";
  reviewer_notes?: string;
  created_at?: string;
}

interface AppSettingRecord {
  id: number;
  type: string;
  name: string;
  group?: string | null;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
}

const taxonomyCategories = [
  { key: "role", slug: "roles", label: "Roles" },
  { key: "type", slug: "types", label: "Types (Tiers)" },
  { key: "position", slug: "positions", label: "Positions" },
  { key: "team", slug: "teams", label: "Teams / Wings" },
  { key: "university", slug: "universities", label: "Universities" },
  { key: "college", slug: "colleges", label: "Colleges" },
  { key: "department", slug: "departments", label: "Departments" },
  { key: "course", slug: "courses", label: "Courses" },
  { key: "branch", slug: "branches", label: "Branches" },
  { key: "semester", slug: "semesters", label: "Semesters" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { section, category } = useParams<{ section?: string; category?: string }>();
  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null);

  // Derive activeTab from URL route param, defaulting to overview
  const validTabs: TabKey[] = [
    "overview",
    "events",
    "scanner",
    "store",
    "members",
    "users",
    "applications",
    "rbac",
    "settings",
    "cart",
    "profile",
  ];
  const activeTab: TabKey = useMemo(() => {
    if (section && validTabs.includes(section as TabKey)) {
      return section as TabKey;
    }
    return "overview";
  }, [section]);

  // Derive selected taxonomy category from URL sub-param (/dashboard/settings/:category)
  const selectedSettingCategory: string = useMemo(() => {
    if (!category) return "role";
    const found = taxonomyCategories.find(
      (c) => c.slug === category.toLowerCase() || c.key === category.toLowerCase()
    );
    return found ? found.key : "role";
  }, [category]);

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Student / User Personal Dashboard Data
  const [userSummary, setUserSummary] = useState<UserDashboardSummary | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    phone: "",
    roll_no: "",
    department: "",
    branch: "",
    course: "",
    semester: "",
    college: "",
    university: "",
    bio: "",
    avatar: "",
    linkedin: "",
    github: "",
  });

  // Password Change state in Profile Tab
  const [passwordFormData, setPasswordFormData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [academicOptions, setAcademicOptions] = useState<{
    universities: string[];
    colleges: string[];
    departments: string[];
    courses: string[];
    branches: string[];
    semesters: string[];
  }>({
    universities: [],
    colleges: [],
    departments: [],
    courses: [],
    branches: [],
    semesters: [],
  });

  // Overview stats state (lightweight metrics)
  const [overviewStats, setOverviewStats] = useState<{
    events_count: number;
    active_events_count: number;
    team_members_count: number;
    community_users_count: number;
    pending_applications_count: number;
    products_count: number;
    settings_count: number;
    recent_applications: ApplicationRecord[];
  } | null>(null);

  // Section-specific Data states (loaded on demand)
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [communityUsers, setCommunityUsers] = useState<ManagedUser[]>([]);
  const [usersPagination, setUsersPagination] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });
  const [loadingCommunityUsers, setLoadingCommunityUsers] = useState(false);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [products, setProducts] = useState<StoreProductRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [allTaxonomies, setAllTaxonomies] = useState<AppSettingRecord[]>([]);
  const [settings, setSettings] = useState<AppSettingRecord[]>([]);
  const [editingSetting, setEditingSetting] = useState<Partial<AppSettingRecord> | null>(null);

  const [allTeamsList, setAllTeamsList] = useState<string[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState("All");

  // Dynamic dropdown lists loaded from app_settings (allTaxonomies)
  const dynamicTeams = useMemo(() => {
    const teamsFromSettings = allTaxonomies
      .filter((s) => s.type === "team" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.name);
    return Array.from(new Set([...teamsFromSettings, ...allTeamsList])).filter(Boolean);
  }, [allTaxonomies, allTeamsList]);

  const dynamicRoles = useMemo(() => {
    const rolesFromSettings = allTaxonomies
      .filter((s) => s.type === "role" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.name);
    return Array.from(new Set([...rolesFromSettings, "Admin", "Team", "User"])).filter(Boolean);
  }, [allTaxonomies]);

  const dynamicTypes = useMemo(() => {
    const typesFromSettings = allTaxonomies
      .filter((s) => s.type === "type" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.name);
    return Array.from(new Set([...typesFromSettings, "Admin", "Lead", "Member", "User"])).filter(Boolean);
  }, [allTaxonomies]);

  const dynamicPositions = useMemo(() => {
    return allTaxonomies
      .filter((s) => s.type === "position" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [allTaxonomies]);

  // Combined options for colleges, courses, branches, semesters, departments from both allTaxonomies & academicOptions
  const dynamicColleges = useMemo(() => {
    const listFromSettings = allTaxonomies
      .filter((s) => s.type === "college" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.name);
    return Array.from(new Set([...listFromSettings, ...(academicOptions.colleges || [])])).filter(Boolean);
  }, [allTaxonomies, academicOptions.colleges]);

  const dynamicCourses = useMemo(() => {
    const listFromSettings = allTaxonomies
      .filter((s) => s.type === "course" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.name);
    return Array.from(new Set([...listFromSettings, ...(academicOptions.courses || []), "B.Tech", "BCA", "BSC", "M.Tech"])).filter(Boolean);
  }, [allTaxonomies, academicOptions.courses]);

  const dynamicBranches = useMemo(() => {
    const listFromSettings = allTaxonomies
      .filter((s) => s.type === "branch" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.name);
    return Array.from(new Set([...listFromSettings, ...(academicOptions.branches || []), "CSE", "AI&DS", "AI&ML"])).filter(Boolean);
  }, [allTaxonomies, academicOptions.branches]);

  const dynamicSemesters = useMemo(() => {
    const listFromSettings = allTaxonomies
      .filter((s) => s.type === "semester" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.name);
    return Array.from(new Set([...listFromSettings, ...(academicOptions.semesters || [])])).filter(Boolean);
  }, [allTaxonomies, academicOptions.semesters]);

  const dynamicDepartments = useMemo(() => {
    const listFromSettings = allTaxonomies
      .filter((s) => s.type === "department" && s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.name);
    return Array.from(new Set([...listFromSettings, ...(academicOptions.departments || [])])).filter(Boolean);
  }, [allTaxonomies, academicOptions.departments]);

  // Modals
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editingUserTab, setEditingUserTab] = useState<"hierarchy" | "profile">("profile");
  const [editingEvent, setEditingEvent] = useState<Partial<EventRecord> | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<StoreProductRecord> | null>(null);
  const [promotingApp, setPromotingApp] = useState<ApplicationRecord | null>(null);
  const [viewingRegistrationsEvent, setViewingRegistrationsEvent] = useState<EventRecord | null>(null);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [activeTicketModal, setActiveTicketModal] = useState<UserRegisteredEvent | null>(null);
  const [viewingUserDetails, setViewingUserDetails] = useState<any | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Prevent background scrolling whenever any dashboard modal is open
  const isAnyDashboardModalOpen = !!(
    editingUser ||
    editingEvent ||
    editingProduct ||
    promotingApp ||
    viewingRegistrationsEvent ||
    editingSetting ||
    activeTicketModal ||
    viewingUserDetails
  );
  useModalScrollLock(isAnyDashboardModalOpen);

  // Promotion Form Data
  const [promoteTeam, setPromoteTeam] = useState("Technical");
  const [promotePosition, setPromotePosition] = useState("Core Member");
  const [promoteNotes, setPromoteNotes] = useState("");

  // Role Checks (RBAC)
  const isPresidentOrVP = useMemo(() => {
    if (!currentUser) return false;
    const isExecutiveRole = currentUser.role === "Admin" || currentUser.is_admin;
    const pos = (currentUser.position || "").toLowerCase();
    return isExecutiveRole || pos.includes("president") || pos.includes("vice president");
  }, [currentUser]);

  const isAdminOnly = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === "Admin" || !!currentUser.is_admin;
  }, [currentUser]);

  const isTeamLead = useMemo(() => {
    if (!currentUser) return false;
    return isPresidentOrVP || currentUser.type === "Lead" || currentUser.is_lead;
  }, [currentUser, isPresidentOrVP]);

  // Dynamic RBAC Permission Checker
  const hasPermission = useCallback((permKey: string) => {
    if (!currentUser) return false;
    // Admins / Executives always have full system access
    if (currentUser.role === "Admin" || currentUser.is_admin) return true;
    if (Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(permKey);
    }
    // Fallback for initial load
    return false;
  }, [currentUser]);

  const canScanQR = useMemo(() => {
    if (!currentUser) return false;
    return hasPermission("scanner.access") || hasPermission("scanner.checkin") || !!currentUser.can_scan_qr;
  }, [currentUser, hasPermission]);

  const userAssignedTeam = currentUser?.team || "";

  useEffect(() => {
    const cachedUser = getStoredUser();
    const token = getStoredToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (cachedUser) {
      setCurrentUser(cachedUser);
    }

    // Always ensure current user authentication profile is active
    apiFetch("/user").then(async (userRes) => {
      if (userRes.ok) {
        const u = await userRes.json();
        setCurrentUser(u);
        setProfileFormData({
          name: u.name || "",
          phone: u.phone || "",
          roll_no: u.roll_no || "",
          department: u.department || "",
          branch: u.branch || "",
          course: u.course || "",
          semester: u.semester || "",
          college: u.college || "",
          university: u.university || "",
          bio: u.bio || "",
          avatar: u.avatar || "",
          linkedin: u.linkedin || "",
          github: u.github || "",
        });
        if (token) {
          storeAuthSession(token, u);
        }
      }
    }).catch(() => {});

    // Fetch dynamic academic options for profile dropdowns
    fetch(ACADEMIC_OPTIONS_URL, { headers: { Accept: "application/json" } })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setAcademicOptions(json.data);
        }
      })
      .catch(() => {});

    // Fetch dynamic taxonomies (roles, types, positions, teams) to ensure dropdowns always have options
    apiFetch("/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.settings && Array.isArray(json.settings)) {
          setAllTaxonomies(json.settings);
          const teamNames = json.settings
            .filter((s: any) => s.type === "team" && s.is_active)
            .map((s: any) => s.name);
          setAllTeamsList(teamNames);
        }
      })
      .catch(() => {});
  }, [navigate]);

  // Load ONLY the data required for the currently active tab/route
  const loadActiveSectionData = useCallback(async () => {
    setLoading(true);
    try {
      if (currentUser?.role === "User") {
        // Community User: Load their personal summary (attended/registered events, store orders)
        if (activeTab === "overview" || activeTab === "events" || activeTab === "cart") {
          const res = await apiFetch("/user/dashboard-summary");
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setUserSummary(data);
            }
          }
        }
        return;
      }

      if (activeTab === "overview") {
        // Lightweight stats endpoint (only counts and 4 recent apps)
        const res = await apiFetch("/admin/overview-stats");
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setOverviewStats(data.stats);
          }
        }
      } else if (activeTab === "events") {
        // Load only events from DB
        const res = await apiFetch("/admin/events");
        if (res.ok) {
          const data = await res.json();
          if (data.events) setEvents(data.events);
        }
      } else if (activeTab === "store") {
        // Load only store products from DB
        const res = await apiFetch("/admin/products");
        if (res.ok) {
          const data = await res.json();
          if (data.products) setProducts(data.products);
        }
      } else if (activeTab === "members") {
        // Load official team members from DB and settings for taxonomy dropdowns
        const [usersRes, settingsRes] = await Promise.all([
          apiFetch("/admin/users?role=Team"),
          allTaxonomies.length === 0 ? apiFetch("/admin/settings") : Promise.resolve(null),
        ]);
        if (usersRes.ok) {
          const uData = await usersRes.json();
          if (uData.users) setUsers(uData.users);
        }
        if (settingsRes && settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.settings) setAllTaxonomies(sData.settings);
        }
      } else if (activeTab === "users") {
        // Load community users with pagination to drastically reduce server & browser load
        loadCommunityUsersPage(1, searchQuery);
      } else if (activeTab === "applications") {
        // Load only applications from DB and settings for team promotion dropdowns
        const [appsRes, settingsRes] = await Promise.all([
          apiFetch("/admin/applications"),
          allTaxonomies.length === 0 ? apiFetch("/admin/settings") : Promise.resolve(null),
        ]);
        if (appsRes.ok) {
          const aData = await appsRes.json();
          if (aData.applications) setApplications(aData.applications);
        }
        if (settingsRes && settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.settings) setAllTaxonomies(sData.settings);
        }
      } else if (activeTab === "settings") {
        if (!isAdminOnly) return;
        // Always load settings for the specifically selected category
        const isPositionCategory = selectedSettingCategory === "position";
        const [catRes, teamRes] = await Promise.all([
          apiFetch(`/admin/settings?category=${selectedSettingCategory}`),
          isPositionCategory ? apiFetch(`/admin/settings?category=team`) : Promise.resolve(null),
        ]);

        if (catRes.ok) {
          const data = await catRes.json();
          if (data.settings) setSettings(data.settings);
        }
        if (teamRes && teamRes.ok) {
          const tData = await teamRes.json();
          if (tData.settings && Array.isArray(tData.settings)) {
            const teamNames = tData.settings.filter((s: any) => s.is_active).map((s: any) => s.name);
            setAllTeamsList(teamNames);
          }
        }
      } else if (activeTab === "rbac") {
        // Load roles & permissions taxonomies
        const res = await apiFetch("/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setAllTaxonomies(data.settings);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedSettingCategory, currentUser?.role]);

  useEffect(() => {
    loadActiveSectionData();
  }, [loadActiveSectionData]);

  const refreshAllData = () => {
    loadActiveSectionData();
  };

  // Paginated Community Users loader
  const loadCommunityUsersPage = async (page: number = 1, search: string = "") => {
    setLoadingCommunityUsers(true);
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await apiFetch(`/admin/users?role=User&per_page=20&page=${page}${q}`);
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setCommunityUsers(data.users);
        }
        if (data.pagination) {
          setUsersPagination(data.pagination);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingCommunityUsers(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser("/login");
  };

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 4000);
  };

  // Filtered members & users
  const teamMembersList = useMemo(() => {
    return users.filter((u) => {
      const isTeam = u.role === "Team" || u.role === "Admin" || u.type === "Lead" || u.type === "Member";
      if (!isTeam) return false;
      if (filterTeam !== "All" && u.team !== filterTeam) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.team || "").toLowerCase().includes(q) ||
          (u.position || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, filterTeam, searchQuery]);

  const generalUsersList = useMemo(() => {
    return users.filter((u) => {
      const isGeneral = u.role === "User" && u.type === "User";
      if (!isGeneral) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.roll_no || "").toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, searchQuery]);

  // Direct Lead Promotion Handler
  const handleLeadDirectPromote = async (userToPromote: any) => {
    const leadTeam = currentUser?.team || "Technical";
    const confirmed = window.confirm(
      `Promote ${userToPromote.name} to Member in ${leadTeam} Team?`
    );
    if (!confirmed) return;

    try {
      const res = await apiFetch(`/admin/users/${userToPromote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "Team",
          type: "Member",
          team: leadTeam,
          position: "Core Member",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || `${userToPromote.name} promoted to ${leadTeam} Member.`);
        // Refresh community list and clear cache so update is reflected immediately
        invalidateApiCache("users");
        invalidateApiCache("members");
        loadCommunityUsersPage(usersPagination.current_page, searchQuery);
      } else {
        showFeedback(data.error || "Failed to promote user.");
      }
    } catch {
      showFeedback("Network error promoting user.");
    }
  };

  // Handler to remove a member from team (demote back to community user)
  const removeMemberFromTeam = async (member: ManagedUser) => {
    if (!confirm(`Are you sure you want to remove ${member.name} from the ${member.team || "current"} team?`)) {
      return;
    }
    try {
      const res = await apiFetch(`/admin/users/${member.id}/remove-member`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || `${member.name} was removed from the team.`);
        // Remove from members list in state
        setUsers((prev) => prev.filter((u) => u.id !== member.id));
        invalidateApiCache("/admin/users");
      } else {
        showFeedback(data.error || "Failed to remove member.");
      }
    } catch {
      showFeedback("Network error removing member.");
    }
  };

  // Handlers
  const saveUserHierarchy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await apiFetch(`/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editingUser.role,
          type: editingUser.type,
          team: editingUser.team,
          position: editingUser.position,
          tag: editingUser.tag,
          show_on_website: editingUser.show_on_website,
          website_order: editingUser.website_order,
          avatar: editingUser.avatar,
          linkedin: editingUser.linkedin,
          github: editingUser.github,
          name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone,
          roll_no: editingUser.roll_no,
          department: editingUser.department,
          branch: editingUser.branch,
          course: editingUser.course,
          semester: editingUser.semester,
          college: editingUser.college,
          university: editingUser.university,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "User profile & hierarchy updated.");
        // Update user in local state
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...editingUser } : u)));
        setCommunityUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...editingUser } : u)));
        setEditingUser(null);
      } else {
        showFeedback(data.error || "Failed to update user.");
      }
    } catch {
      showFeedback("Network error updating user.");
    }
  };

  const saveEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      // Ensure perks, tags, and speakers are arrays or null
      const payload = {
        ...editingEvent,
        perks: Array.isArray(editingEvent.perks)
          ? editingEvent.perks.map((p) => String(p).trim()).filter(Boolean)
          : typeof editingEvent.perks === "string"
          ? (editingEvent.perks as string).split(",").map((p) => p.trim()).filter(Boolean)
          : [],
        tags: Array.isArray(editingEvent.tags)
          ? editingEvent.tags.map((t) => String(t).trim()).filter(Boolean)
          : typeof editingEvent.tags === "string"
          ? (editingEvent.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        speakers: Array.isArray(editingEvent.speakers)
          ? editingEvent.speakers.filter((s) => s && s.name && s.name.trim())
          : [],
      };

      const res = await apiFetch("/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Event saved successfully.");
        setEditingEvent(null);
        refreshAllData();
      } else {
        showFeedback(data.error || "Failed to save event.");
      }
    } catch {
      showFeedback("Network error saving event.");
    }
  };

  const deleteEventSubmit = async (id: number) => {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await apiFetch(`/admin/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("Event deleted.");
        refreshAllData();
      }
    } catch {
      showFeedback("Failed to delete event.");
    }
  };

  const saveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const payload = {
        ...editingProduct,
        sizes: Array.isArray(editingProduct.sizes)
          ? editingProduct.sizes.map(s => String(s).trim()).filter(Boolean)
          : typeof editingProduct.sizes === "string"
          ? (editingProduct.sizes as string).split(",").map(s => s.trim()).filter(Boolean)
          : [],
      };
      const res = await apiFetch("/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Product saved.");
        setEditingProduct(null);
        refreshAllData();
      } else {
        showFeedback(data.error || "Failed to save product.");
      }
    } catch {
      showFeedback("Network error saving product.");
    }
  };

  const deleteProductSubmit = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("Product removed.");
        refreshAllData();
      }
    } catch {
      showFeedback("Failed to delete product.");
    }
  };

  const handlePromoteApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingApp) return;
    try {
      const res = await apiFetch(`/admin/applications/${promotingApp.id}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_team: promoteTeam,
          target_position: promotePosition,
          reviewer_notes: promoteNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Applicant approved and promoted!");
        setPromotingApp(null);
        refreshAllData();
      } else {
        showFeedback(data.error || "Promotion failed.");
      }
    } catch {
      showFeedback("Network error.");
    }
  };

  const handleRejectApp = async (id: number) => {
    const notes = prompt("Enter reason for rejection (optional):");
    try {
      const res = await apiFetch(`/admin/applications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_notes: notes || "" }),
      });
      if (res.ok) {
        showFeedback("Application rejected.");
        refreshAllData();
      }
    } catch {
      showFeedback("Failed to update application.");
    }
  };

  const viewRegistrations = async (ev: EventRecord) => {
    setViewingRegistrationsEvent(ev);
    try {
      const res = await apiFetch(`/admin/events/${ev.id}/registrations`);
      if (res.ok) {
        const data = await res.json();
        setEventRegistrations(data.registrations || []);
      }
    } catch {
      setEventRegistrations([]);
    }
  };

  // Handlers for App Settings (Taxonomies: roles, courses, branches, positions, etc.)
  const saveSettingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetting) return;
    try {
      const res = await apiFetch("/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSetting),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Setting saved successfully.");
        setEditingSetting(null);
        refreshAllData();
      } else {
        showFeedback(data.error || "Failed to save setting.");
      }
    } catch {
      showFeedback("Network error saving setting.");
    }
  };

  const deleteSettingSubmit = async (id: number) => {
    if (!confirm("Are you sure you want to delete this option?")) return;
    try {
      const res = await apiFetch(`/admin/settings/${id}`, { method: "DELETE" });
      if (res.ok) {
        showFeedback("Option deleted.");
        refreshAllData();
      }
    } catch {
      showFeedback("Failed to delete option.");
    }
  };

  // Drag and drop states for ordering
  const [draggedSettingIndex, setDraggedSettingIndex] = useState<number | null>(null);
  const [draggedMemberIndex, setDraggedMemberIndex] = useState<number | null>(null);

  // Reorder settings via Drag & Drop
  const handleSettingDragStart = (index: number) => {
    setDraggedSettingIndex(index);
  };

  const handleSettingDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSettingDrop = async (dropIndex: number) => {
    if (draggedSettingIndex === null || draggedSettingIndex === dropIndex) return;

    const updated = [...settings];
    const [movedItem] = updated.splice(draggedSettingIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    // Update sort_order locally for instant UI feedback
    const reordered = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setSettings(reordered);
    setDraggedSettingIndex(null);

    try {
      const orderedIds = reordered.map((item) => item.id);
      const res = await apiFetch("/admin/settings/reorder", {
        method: "POST",
        body: JSON.stringify({ ordered_ids: orderedIds }),
      });
      if (res.ok) {
        showFeedback("Order updated successfully.");
      } else {
        showFeedback("Failed to persist order.");
        refreshAllData();
      }
    } catch {
      showFeedback("Network error updating order.");
      refreshAllData();
    }
  };

  // Reorder website team members via Drag & Drop
  const handleMemberDragStart = (index: number) => {
    setDraggedMemberIndex(index);
  };

  const handleMemberDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMemberDrop = async (dropIndex: number, currentFilteredList: ManagedUser[]) => {
    if (draggedMemberIndex === null || draggedMemberIndex === dropIndex) return;

    const updatedFiltered = [...currentFilteredList];
    const [movedMember] = updatedFiltered.splice(draggedMemberIndex, 1);
    updatedFiltered.splice(dropIndex, 0, movedMember);

    // Update website_order locally
    const reorderedIds = updatedFiltered.map((m) => m.id);
    setUsers((prev) => {
      return prev.map((u) => {
        const idx = reorderedIds.indexOf(u.id);
        if (idx !== -1) {
          return { ...u, website_order: idx + 1 };
        }
        return u;
      });
    });

    setDraggedMemberIndex(null);

    try {
      const res = await apiFetch("/admin/members/reorder", {
        method: "POST",
        body: JSON.stringify({ ordered_ids: reorderedIds }),
      });
      if (res.ok) {
        showFeedback("Website member order updated.");
      } else {
        showFeedback("Failed to persist member order.");
        refreshAllData();
      }
    } catch {
      showFeedback("Network error updating member order.");
      refreshAllData();
    }
  };

  // Open user details popup
  const openUserDetailsModal = async (userId: number) => {
    setLoadingUserDetails(true);
    setViewingUserDetails(null);
    try {
      const res = await apiFetch(`/admin/users/${userId}/details`);
      const data = await res.json();
      if (res.ok && data.success) {
        setViewingUserDetails(data);
      } else {
        showFeedback(data.error || "Failed to load user details.");
      }
    } catch {
      showFeedback("Network error fetching user details.");
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Toggle user block / unblock status
  const toggleUserBlockStatus = async (userToUpdate: any) => {
    const isCurrentlyBlocked = userToUpdate.status === "blocked";
    const nextStatus = isCurrentlyBlocked ? "active" : "blocked";
    const actionLabel = isCurrentlyBlocked ? "unblock" : "block";

    if (!confirm(`Are you sure you want to ${actionLabel} ${userToUpdate.name || "this user"}?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/admin/users/${userToUpdate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || `User successfully ${isCurrentlyBlocked ? "unblocked" : "blocked"}.`);

        // Update viewing modal state if open
        setViewingUserDetails((prev: any) => {
          if (!prev || !prev.user) return prev;
          return {
            ...prev,
            user: { ...prev.user, status: nextStatus },
          };
        });

        // Update community users pagination list in place
        setCommunityUsers((prev) =>
          prev.map((u) => (u.id === userToUpdate.id ? { ...u, status: nextStatus } : u))
        );

        // Update users list in place if present
        setUsers((prev) =>
          prev.map((u) => (u.id === userToUpdate.id ? { ...u, status: nextStatus } : u))
        );
      } else {
        showFeedback(data.error || `Failed to ${actionLabel} user.`);
      }
    } catch {
      showFeedback(`Network error trying to ${actionLabel} user.`);
    }
  };

  // Profile Form submit handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await apiFetch("/user/profile", {
        method: "POST",
        body: JSON.stringify(profileFormData),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Profile details updated successfully.");
        // Use the returned fresh user data from server
        const savedUser = data.user || { ...currentUser, ...profileFormData };
        setCurrentUser(savedUser);
        setProfileFormData({
          name: savedUser.name || "",
          phone: savedUser.phone || "",
          roll_no: savedUser.roll_no || "",
          department: savedUser.department || "",
          branch: savedUser.branch || "",
          course: savedUser.course || "",
          semester: savedUser.semester || "",
          college: savedUser.college || "",
          university: savedUser.university || "",
          bio: savedUser.bio || "",
          avatar: savedUser.avatar || "",
          linkedin: savedUser.linkedin || "",
          github: savedUser.github || "",
        });
        localStorage.setItem("codezen_user", JSON.stringify(savedUser));
      } else {
        const errDetail = data.errors ? Object.values(data.errors).flat().join(" ") : null;
        showFeedback(errDetail || data.message || data.error || "Failed to update profile.");
      }
    } catch {
      showFeedback("Network error saving profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Change Password submit handler (no current password requested)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!passwordFormData.password) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (passwordFormData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (passwordFormData.password !== passwordFormData.password_confirmation) {
      setPasswordError("New password and confirmation password do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await apiFetch("/user/change-password", {
        method: "POST",
        body: JSON.stringify(passwordFormData),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback(data.message || "Password updated successfully.");
        setPasswordFormData({ password: "", password_confirmation: "" });
      } else {
        const errDetail = data.errors ? Object.values(data.errors).flat().join(" ") : null;
        setPasswordError(errDetail || data.message || data.error || "Failed to update password.");
      }
    } catch {
      setPasswordError("Network error changing password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const isCommunityUser = currentUser?.role === "User";

  const navMenuItems = useMemo(() => {
    interface MenuItem {
      key: string;
      path: string;
      label: string;
      icon: any;
      badge?: number;
      alert?: boolean;
    }

    if (isCommunityUser) {
      const communityItems: MenuItem[] = [
        {
          key: "overview",
          path: "/dashboard",
          label: "My Dashboard",
          icon: LayoutDashboard,
        },
        {
          key: "events",
          path: "/dashboard/events",
          label: "Events",
          icon: Calendar,
        },
      ];

      if (canScanQR) {
        communityItems.push({
          key: "scanner",
          path: "/dashboard/scanner",
          label: "QR Scanner",
          icon: QrCode,
        });
      }

      communityItems.push(
        {
          key: "cart",
          path: "/dashboard/cart",
          label: "My Cart",
          icon: ShoppingCart,
        },
        {
          key: "profile",
          path: "/dashboard/profile",
          label: "Profile",
          icon: User,
        }
      );

      return communityItems;
    }

    const navItems: MenuItem[] = [
      { key: "overview", path: "/dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
    ];

    if (hasPermission("events.view")) {
      navItems.push({
        key: "events",
        path: "/dashboard/events",
        label: "Events & Hackathons",
        icon: Calendar,
      });
    }

    if (canScanQR) {
      navItems.push({
        key: "scanner",
        path: "/dashboard/scanner",
        label: "QR Check-in Scanner",
        icon: QrCode,
      });
    }

    if (hasPermission("store.view")) {
      navItems.push({
        key: "store",
        path: "/dashboard/store",
        label: "Store Inventory",
        icon: ShoppingBag,
      });
    }

    if (hasPermission("members.view")) {
      navItems.push({
        key: "members",
        path: "/dashboard/members",
        label: "Team Members",
        icon: UserCheck,
      });
    }

    if (hasPermission("users.view")) {
      navItems.push({
        key: "users",
        path: "/dashboard/users",
        label: "Registered Users",
        icon: Users,
      });
    }

    if (hasPermission("applications.view")) {
      navItems.push({
        key: "applications",
        path: "/dashboard/applications",
        label: "Applications",
        icon: FileText,
      });
    }

    // Only Admin can see and manage Roles & Permissions (RBAC) and Dynamic Settings
    if (isAdminOnly || hasPermission("rbac.manage")) {
      navItems.push(
        { key: "rbac", path: "/dashboard/rbac", label: "Roles & Permissions", icon: Shield }
      );
    }

    if (isAdminOnly || hasPermission("settings.manage")) {
      navItems.push(
        { key: "settings", path: "/dashboard/settings", label: "Dynamic Settings", icon: Settings }
      );
    }

    navItems.push(
      { key: "profile", path: "/dashboard/profile", label: "My Profile", icon: User }
    );

    return navItems;
  }, [
    isCommunityUser,
    isAdminOnly,
    hasPermission,
    userSummary,
    canScanQR,
    overviewStats,
    events.length,
    products.length,
    teamMembersList.length,
    generalUsersList.length,
    applications,
    settings.length,
  ]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans antialiased">
      
      {/* Toast Feedback */}
      {actionMessage && (
        <div className="fixed top-4 right-4 z-[999] px-4 py-2.5 bg-white text-black text-xs font-bold border border-black shadow-lg flex items-center gap-2">
          <Check size={14} className="text-black" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TYPICAL ADMIN SIDEBAR (BLACK & WHITE DESIGN)          */}
      {/* ======================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-white text-black font-black text-xs flex items-center justify-center">
                CZ
              </div>
              <span className="font-bold text-xs tracking-wider uppercase text-white">
                {isCommunityUser ? "CODEZEN PORTAL" : "CODEZEN ADMIN"}
              </span>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Snippet in Sidebar */}
          <Link
            to="/dashboard/profile"
            onClick={() => setMobileSidebarOpen(false)}
            className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between hover:bg-zinc-900/70 transition-colors group"
            title="Click to view & edit your profile"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border border-zinc-700 object-cover group-hover:border-white shrink-0 transition-colors"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900 group-hover:border-white flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 transition-colors">
                  {currentUser?.name ? currentUser.name.charAt(0) : "U"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-zinc-200">
                  {currentUser?.name || "Member"}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">
                  {isCommunityUser
                    ? "COMMUNITY USER"
                    : currentUser?.position || currentUser?.role || "Administrator"}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-300 uppercase font-mono font-bold">
              Edit
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <p className="px-3 pt-2 pb-1.5 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">
              Main Menu
            </p>
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors rounded-sm ${
                    isActive
                      ? "bg-white text-black font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon size={15} className={isActive ? "text-black" : "text-zinc-400"} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-black text-white"
                          : item.alert && item.badge > 0
                          ? "bg-white text-black font-bold"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Back to Website & Logout */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <ExternalLink size={13} />
            <span>View Public Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA WITH TOPBAR                         */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        
        {/* TOPBAR */}
        <header className="h-14 border-b border-zinc-800 bg-black px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-mono uppercase">SYSTEM</span>
              <span className="text-zinc-700">/</span>
              <span className="text-white font-semibold capitalize">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* RBAC Access Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 border border-zinc-850 bg-zinc-900/90 text-xs text-zinc-300 rounded-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="font-medium">
                {isCommunityUser
                  ? "Student Member"
                  : isPresidentOrVP
                  ? "Executive Board (Superadmin)"
                  : isTeamLead
                  ? `Team Lead: ${userAssignedTeam || "General"}`
                  : "Member (Read-only)"}
              </span>
            </div>

            <button
              onClick={refreshAllData}
              title="Refresh Data"
              className="p-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* BODY SCROLL AREA */}
        <main
          data-lenis-prevent
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 overscroll-contain"
        >
          
          {/* ======================================================== */}
          {/* TAB: OVERVIEW                                            */}
          {/* ======================================================== */}
          {activeTab === "overview" && (
            isCommunityUser ? (
              <div className="space-y-6">
                {/* Community User Overview Banner */}
                <div className="border border-zinc-800 bg-zinc-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block mb-1">
                      STUDENT OVERVIEW PORTAL
                    </span>
                    <h2 className="text-xl font-bold uppercase tracking-tight text-white">
                      Welcome, {currentUser?.name || "Member"}
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-1">
                      {currentUser?.college || "CGC University"} &bull; {currentUser?.department || "Student Member"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/events"
                      className="px-4 py-2 bg-white text-black text-xs font-bold font-mono uppercase hover:bg-zinc-200 transition-colors"
                    >
                      Browse Upcoming Events
                    </Link>
                  </div>
                </div>

                {/* Stat Cards for Community User */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border border-zinc-800 bg-zinc-950">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">
                      EVENTS ATTENDED / PARTICIPATED
                    </span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-white font-mono">
                        {userSummary?.stats?.events_attended ?? 0}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        Concluded
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-zinc-800 bg-zinc-950">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">
                      EVENTS REGISTERED
                    </span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-white font-mono">
                        {userSummary?.stats?.events_registered ?? 0}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Total
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-zinc-800 bg-zinc-950">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">
                      ORDERS & MERCH
                    </span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-white font-mono">
                        {userSummary?.stats?.orders_count ?? 0}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">Items</span>
                    </div>
                  </div>

                  <div className="p-4 border border-zinc-800 bg-zinc-950">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">
                      TOTAL SPENT / COMMITTED
                    </span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-2xl font-bold text-white font-mono">
                        ₹{userSummary?.stats?.total_spent ?? 0}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">INR</span>
                    </div>
                  </div>
                </div>

                {/* Recent Registered Events for User */}
                <div className="border border-zinc-800 bg-zinc-950">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      My Registered & Attended Events
                    </h3>
                    <Link
                      to="/dashboard/events"
                      className="text-[11px] text-zinc-400 hover:text-white uppercase font-mono underline"
                    >
                      View All ({userSummary?.events?.length || 0})
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 font-mono">
                        <tr>
                          <th className="p-3">Event Code & Title</th>
                          <th className="p-3">Format / Mode</th>
                          <th className="p-3">Schedule</th>
                          <th className="p-3">Venue</th>
                          <th className="p-3">Attendance</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 font-mono">
                        {!userSummary?.events || userSummary.events.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                              You have not registered for any events yet.{" "}
                              <Link to="/events" className="text-white underline ml-1">
                                Explore upcoming events
                              </Link>
                            </td>
                          </tr>
                        ) : (
                          userSummary.events.slice(0, 5).map((ev) => {
                            const isPresent = (ev.attendance_status || "").toLowerCase() === "present";
                            return (
                              <tr key={ev.registration_id} className="hover:bg-zinc-900/50">
                                <td className="p-3">
                                  <span className="text-[10px] text-zinc-500 uppercase block">
                                    {ev.event_code}
                                  </span>
                                  <span className="font-bold text-white block">
                                    {ev.event_title}
                                  </span>
                                </td>
                                <td className="p-3 text-zinc-300">
                                  <span>{ev.event_type}</span>
                                  <span className="text-[10px] text-zinc-500 block">{ev.mode}</span>
                                </td>
                                <td className="p-3 text-zinc-300">{ev.start_date || "-"}</td>
                                <td className="p-3 text-zinc-300 truncate max-w-[150px]">{ev.venue}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 border text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1 ${
                                      isPresent
                                        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                        : "border-red-500/30 text-red-400 bg-red-500/10"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-emerald-400" : "bg-red-400"}`} />
                                    <span>{isPresent ? "Present" : "Absent"}</span>
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTicketModal(ev)}
                                    className="px-2.5 py-1 border border-zinc-700 hover:border-white text-zinc-300 hover:text-white bg-zinc-900 text-[10px] uppercase tracking-wider inline-flex items-center gap-1"
                                  >
                                    <QrCode size={11} />
                                    <span>Ticket</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Merch & Orders for User */}
                <div className="border border-zinc-800 bg-zinc-950">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Recent Purchases & Swag Orders
                    </h3>
                    <Link
                      to="/dashboard/cart"
                      className="text-[11px] text-zinc-400 hover:text-white uppercase font-mono underline"
                    >
                      View All Orders ({userSummary?.orders?.length || 0})
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 font-mono">
                        <tr>
                          <th className="p-3">Order #</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Size / Qty</th>
                          <th className="p-3">Total Amount</th>
                          <th className="p-3">Pickup Token</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 font-mono">
                        {!userSummary?.orders || userSummary.orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                              No store purchase or swag request found.{" "}
                              <Link to="/store" className="text-white underline ml-1">
                                Visit CodeZen Store
                              </Link>
                            </td>
                          </tr>
                        ) : (
                          userSummary.orders.slice(0, 4).map((ord) => (
                            <tr key={ord.id} className="hover:bg-zinc-900/50">
                              <td className="p-3 text-zinc-400">{ord.order_number}</td>
                              <td className="p-3 font-bold text-white">{ord.product_name}</td>
                              <td className="p-3 text-zinc-300">
                                {ord.size || "Standard"} &times; {ord.quantity}
                              </td>
                              <td className="p-3 text-white font-bold">₹{ord.total_amount}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-300 text-[10px]">
                                  {ord.pickup_token || "-"}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] uppercase font-bold">
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border border-zinc-800 bg-zinc-950">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                    TOTAL SPRINT EVENTS
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-white">
                      {overviewStats ? overviewStats.events_count : events.length}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {overviewStats ? overviewStats.active_events_count : events.filter((e) => e.status === "REGISTRATION OPEN").length} Active
                    </span>
                  </div>
                </div>

                <div className="p-4 border border-zinc-800 bg-zinc-950">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                    CORE TEAM MEMBERS
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-white">
                      {overviewStats ? overviewStats.team_members_count : users.filter((u) => u.role === "Team" || u.role === "Admin").length}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Functional Core
                    </span>
                  </div>
                </div>

                <div className="p-4 border border-zinc-800 bg-zinc-950">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                    COMMUNITY ACCOUNTS
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-white">
                      {overviewStats ? overviewStats.community_users_count : users.filter((u) => u.role === "User").length}
                    </span>
                    <span className="text-[11px] text-zinc-400">Registered</span>
                  </div>
                </div>

                <div className="p-4 border border-zinc-800 bg-zinc-950">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">
                    PENDING APPLICATIONS
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-white">
                      {overviewStats ? overviewStats.pending_applications_count : applications.filter((a) => a.status === "Pending").length}
                    </span>
                    <span className="text-[11px] text-zinc-400">Needs Review</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                  Quick Actions & Shortcuts
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/dashboard/events"
                    className="px-3 py-1.5 border border-zinc-700 hover:border-white text-xs uppercase text-zinc-300 hover:text-white transition-colors"
                  >
                    + Manage Events
                  </Link>
                  <Link
                    to="/dashboard/applications"
                    className="px-3 py-1.5 border border-zinc-700 hover:border-white text-xs uppercase text-zinc-300 hover:text-white transition-colors"
                  >
                    Review Recruitment Applications
                  </Link>
                  <Link
                    to="/dashboard/store"
                    className="px-3 py-1.5 border border-zinc-700 hover:border-white text-xs uppercase text-zinc-300 hover:text-white transition-colors"
                  >
                    Update Store Inventory
                  </Link>
                  <Link
                    to="/dashboard/members"
                    className="px-3 py-1.5 border border-zinc-700 hover:border-white text-xs uppercase text-zinc-300 hover:text-white transition-colors"
                  >
                    Manage Team & Roles
                  </Link>
                </div>
              </div>

              {/* Recent Applications Snapshot */}
              <div className="border border-zinc-800 bg-zinc-950">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Recent Membership Applications
                  </h3>
                  <Link
                    to="/dashboard/applications"
                    className="text-[11px] text-zinc-400 hover:text-white uppercase underline"
                  >
                    View All ({overviewStats ? overviewStats.pending_applications_count : applications.length})
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Applicant Name</th>
                        <th className="p-3">Email / Phone</th>
                        <th className="p-3">Target Wing</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {((overviewStats?.recent_applications || applications).slice(0, 4)).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-zinc-500 font-mono text-xs">
                            No recruitment applications received yet.
                          </td>
                        </tr>
                      ) : (
                        (overviewStats?.recent_applications || applications).slice(0, 4).map((app) => (
                          <tr key={app.id} className="hover:bg-zinc-900/50">
                            <td className="p-3 font-bold text-white">{app.name}</td>
                            <td className="p-3 text-zinc-400">{app.email}</td>
                            <td className="p-3 text-zinc-300">{app.target_team} ({app.target_position})</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 border border-zinc-700 text-[10px] uppercase">
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )
          )}

          {/* ======================================================== */}
          {/* TAB: EVENTS CRUD & REGISTRATIONS                         */}
          {/* ======================================================== */}
          {activeTab === "events" && (
            isCommunityUser ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                      My Registered & Attended Events
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      All hackathons, bootcamps, and workshops you have registered for or attended.
                    </p>
                  </div>

                  <Link
                    to="/events"
                    className="px-3 py-1.5 bg-white text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Register New Event</span>
                  </Link>
                </div>

                {/* Table of User's Events */}
                <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                        <tr>
                          <th className="p-3">Event Code & Title</th>
                          <th className="p-3">Format / Mode</th>
                          <th className="p-3">Schedule Date</th>
                          <th className="p-3">Location / Venue</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {!userSummary?.events || userSummary.events.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                              You haven't registered for any events yet. Check out the{" "}
                              <Link to="/events" className="text-white underline ml-1">
                                Codezen Events
                              </Link>
                              !
                            </td>
                          </tr>
                        ) : (
                          userSummary.events.map((ev) => {
                            const isPresent = (ev.attendance_status || "").toLowerCase() === "present";
                            return (
                              <tr key={ev.registration_id} className="hover:bg-zinc-900/50">
                                <td className="p-3">
                                  <span className="text-[10px] text-zinc-500 uppercase block">
                                    {ev.event_code}
                                  </span>
                                  <span className="font-bold text-white block">
                                    {ev.event_title}
                                  </span>
                                </td>
                                <td className="p-3 text-zinc-300">
                                  <span>{ev.event_type}</span>
                                  <span className="text-[10px] text-zinc-500 block">{ev.mode}</span>
                                </td>
                                <td className="p-3 text-zinc-300">
                                  <span>{ev.start_date || "-"}</span>
                                  {ev.registered_at && (
                                    <span className="text-[10px] text-zinc-500 block">
                                      Registered: {ev.registered_at}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-zinc-300 max-w-[180px] truncate">
                                  {ev.venue}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2.5 py-1 border text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1 ${
                                      isPresent
                                        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                        : "border-red-500/30 text-red-400 bg-red-500/10"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                                    <span>{isPresent ? "Present" : "Absent"}</span>
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTicketModal(ev)}
                                    className="px-3 py-1.5 border border-zinc-700 hover:border-white text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5 font-mono transition-colors"
                                  >
                                    <QrCode size={13} />
                                    <span>View Ticket</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Events & Hackathons Management
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    Create, edit, and track registrations for all sprints and workshops.
                  </p>
                </div>

                {hasPermission("events.create") && (
                  <button
                    onClick={() =>
                      setEditingEvent({
                        code: `CZ-SPRINT-${events.length + 1}`,
                        title: "",
                        type: "Workshop",
                        mode: "Offline",
                        participation: "Single",
                        status: "UPCOMING",
                        visibility: "Public",
                        registration_open: true,
                        start_date: "",
                        time: "",
                        duration: "",
                        venue: "CGC Campus",
                      })
                    }
                    className="px-3 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Create Event</span>
                  </button>
                )}
              </div>

              {/* Table of Events */}
              <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Code / Title</th>
                        <th className="p-3">Format / Mode</th>
                        <th className="p-3">Schedule</th>
                        <th className="p-3">Venue</th>
                        <th className="p-3">Visibility</th>
                        <th className="p-3">Registration</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Regs</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-zinc-500 font-mono text-xs">
                            No events found in database. Click "Create Event" to publish one.
                          </td>
                        </tr>
                      ) : (
                        events.map((ev) => (
                          <tr key={ev.id} className="hover:bg-zinc-900/50">
                            <td className="p-3">
                              <span className="text-[10px] text-zinc-500 uppercase block">{ev.code}</span>
                              <span className="font-bold text-white block">{ev.title}</span>
                            </td>
                            <td className="p-3 text-zinc-300">
                              <span>{ev.type}</span>
                              <span className="text-[10px] text-zinc-500 block">{ev.mode} ({ev.participation})</span>
                            </td>
                            <td className="p-3 text-zinc-300">
                              <span>{ev.start_date || "-"}</span>
                              <span className="text-[10px] text-zinc-500 block">{ev.duration || ""}</span>
                            </td>
                            <td className="p-3 text-zinc-300 truncate max-w-[150px]">{ev.venue}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
                                  (ev.visibility ?? "Public") === "Public"
                                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                    : "border-zinc-700 text-zinc-400 bg-zinc-900"
                                }`}
                              >
                                {ev.visibility ?? "Public"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
                                  ev.registration_open !== false
                                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                    : "border-red-500/40 text-red-400 bg-red-500/10"
                                }`}
                              >
                                {ev.registration_open !== false ? "Open" : "Closed"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 border border-zinc-700 text-[10px] uppercase">
                                {ev.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  to={`/dashboard/events/${ev.id}/registrations`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-zinc-800 hover:border-white bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded transition-colors group"
                                  title="Open dedicated attendee registrations & attendance page"
                                >
                                  <span>{ev.registrations_count || 0} Registrations</span>
                                  <ExternalLink size={12} className="text-zinc-500 group-hover:text-white" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => viewRegistrations(ev)}
                                  className="p-1 border border-zinc-800 hover:border-zinc-600 bg-zinc-900 text-zinc-400 hover:text-white rounded"
                                  title="Quick Preview"
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {(hasPermission("events.edit") || hasPermission("events.delete")) && (
                                <div className="inline-flex items-center gap-1.5">
                                  {hasPermission("events.edit") && (
                                    <button
                                      onClick={() => setEditingEvent(ev)}
                                      className="px-2 py-1 border border-zinc-700 hover:border-white text-[10px] uppercase text-zinc-300"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {hasPermission("events.delete") && (
                                    <button
                                      onClick={() => deleteEventSubmit(ev.id)}
                                      className="px-2 py-1 border border-zinc-800 hover:border-red-500 text-[10px] uppercase text-zinc-400 hover:text-red-400"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )
          )}

          {/* ======================================================== */}
          {/* TAB: QR CODE SCANNER (CHECK-IN TERMINAL)                  */}
          {/* ======================================================== */}
          {activeTab === "scanner" && canScanQR && (
            <QRScannerTab />
          )}

          {/* ======================================================== */}
          {/* TAB: STORE INVENTORY                                     */}
          {/* ======================================================== */}
          {activeTab === "store" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Store Inventory & Products
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    Control official merchandise, apparel pricing, and stock quotas.
                  </p>
                </div>

                {hasPermission("store.manage") && (
                  <button
                    onClick={() =>
                      setEditingProduct({
                        sku: `CZ-SKU-${products.length + 1}`,
                        name: "",
                        category: "Apparel",
                        price: 999,
                        original_price: 1299,
                        stock: 50,
                        status: "Active",
                        description: "",
                        sizes: ["M", "L", "XL"],
                      })
                    }
                    className="px-3 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                )}
              </div>

              <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price (INR)</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-500 font-mono text-xs">
                            No products found in store inventory. Click "Add Item" to add merchandise.
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-900/50">
                            <td className="p-3 font-bold text-zinc-400">{p.sku}</td>
                            <td className="p-3 font-bold text-white">{p.name}</td>
                            <td className="p-3 text-zinc-300">{p.category}</td>
                            <td className="p-3 text-white font-bold">₹{p.price}</td>
                            <td className="p-3 text-zinc-300">{p.stock} units</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 border border-zinc-700 text-[10px] uppercase">
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {(hasPermission("store.manage") || hasPermission("store.delete")) && (
                                <div className="inline-flex items-center gap-1.5">
                                  {hasPermission("store.manage") && (
                                    <button
                                      onClick={() => setEditingProduct(p)}
                                      className="px-2 py-1 border border-zinc-700 hover:border-white text-[10px] uppercase text-zinc-300"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {hasPermission("store.delete") && (
                                    <button
                                      onClick={() => deleteProductSubmit(p.id)}
                                      className="px-2 py-1 border border-zinc-800 hover:border-red-500 text-[10px] uppercase text-zinc-400 hover:text-red-400"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: TEAM MEMBERS                                 */}
          {/* ======================================================== */}
          {activeTab === "members" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Core Team Members Hierarchy
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    Official club leads, co-heads, and core wing members.
                  </p>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {["All", ...dynamicTeams].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterTeam(t)}
                      className={`px-2.5 py-1 text-[10px] uppercase tracking-wider border transition-colors ${
                        filterTeam === t
                          ? "bg-white text-black font-bold border-white"
                          : "border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3 w-10 text-center"></th>
                        <th className="p-3">Member Name / Email</th>
                        <th className="p-3">Team Wing</th>
                        <th className="p-3">Designated Position</th>
                        <th className="p-3">Website Feature</th>
                        <th className="p-3">Portal Role</th>
                        <th className="p-3">Tier</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {teamMembersList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-zinc-500 font-mono text-xs">
                            No team members found for this filter.
                          </td>
                        </tr>
                      ) : (
                        teamMembersList.map((m, idx) => {
                          const isBeingDragged = draggedMemberIndex === idx;
                          return (
                            <tr
                              key={m.id}
                              draggable={hasPermission("members.reorder")}
                              onDragStart={() => handleMemberDragStart(idx)}
                              onDragOver={handleMemberDragOver}
                              onDrop={() => handleMemberDrop(idx, teamMembersList)}
                              className={`transition-colors select-none ${
                                isBeingDragged ? "opacity-30 bg-zinc-800/80" : "hover:bg-zinc-900/60"
                              } ${hasPermission("members.reorder") ? "cursor-grab active:cursor-grabbing" : ""}`}
                            >
                              <td className="p-3 text-center text-zinc-600 hover:text-zinc-300 w-10">
                                {hasPermission("members.reorder") && <GripVertical size={14} className="mx-auto" />}
                              </td>
                              <td className="p-3">
                                <span className="font-bold text-white block">{m.name}</span>
                                <span className="text-[10px] text-zinc-500 block">{m.email}</span>
                              </td>
                              <td className="p-3 font-bold text-zinc-300">{m.team || "General"}</td>
                              <td className="p-3 text-white">{m.position || "Member"}</td>
                              <td className="p-3">
                                {m.show_on_website ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] uppercase font-bold">
                                    <span>Order #{m.website_order || 1}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-600 uppercase">Hidden</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 border border-zinc-700 text-[10px] uppercase">
                                  {m.role}
                                </span>
                              </td>
                              <td className="p-3 text-zinc-400 uppercase text-[10px]">{m.type}</td>
                              <td className="p-3 text-right">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  {/* Only Leads (for their own team members) or System Admins can remove members */}
                                  {m.id !== currentUser?.id && (isAdminOnly || (isTeamLead && currentUser?.team && m.team && m.team.toLowerCase() === currentUser.team.toLowerCase())) && (
                                    <button
                                      type="button"
                                      onClick={() => removeMemberFromTeam(m)}
                                      className="px-2.5 py-1 border border-red-950/70 hover:border-red-600 bg-red-950/20 hover:bg-red-950/50 text-[10px] font-semibold uppercase text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                                      title={`Remove ${m.name} from ${m.team || "team"}`}
                                    >
                                      <UserMinus size={11} />
                                      <span>Remove</span>
                                    </button>
                                  )}

                                  {hasPermission("users.edit") && (
                                    <button
                                      onClick={() => setEditingUser(m)}
                                      className="px-2.5 py-1 border border-zinc-700 hover:border-white text-[10px] uppercase text-zinc-300"
                                    >
                                      Modify Role
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
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: REGISTERED COMMUNITY USERS                         */}
          {/* ======================================================== */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Registered Community Users & Attendees
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    Students registered for attending campus events, hackathons, and workshops.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative min-w-[240px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search name, roll no, college..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          loadCommunityUsersPage(1, searchQuery);
                        }
                      }}
                      className="w-full pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          loadCommunityUsersPage(1, "");
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => loadCommunityUsersPage(1, searchQuery)}
                    className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white rounded flex items-center gap-1 transition-colors"
                  >
                    <Search size={12} />
                    <span>Search</span>
                  </button>
                </div>
              </div>

              <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3">User & Contact</th>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Academic Details</th>
                        <th className="p-3">Account Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {loadingCommunityUsers ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-zinc-400 font-mono text-xs">
                            <div className="inline-flex items-center gap-2">
                              <RefreshCw size={14} className="animate-spin text-white" />
                              <span>Loading community users...</span>
                            </div>
                          </td>
                        </tr>
                      ) : communityUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-zinc-500 font-mono text-xs">
                            No community users found matching your search.
                          </td>
                        </tr>
                      ) : (
                        communityUsers.map((u) => {
                          const isBlocked = u.status === "blocked";
                          return (
                            <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                      {(u.name || "U").slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-bold text-white block text-xs">{u.name}</span>
                                    <span className="text-[11px] text-zinc-400 block font-mono">{u.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-mono text-xs text-zinc-300">
                                {u.roll_no ? (
                                  <span className="px-2 py-0.5 border border-zinc-800 bg-zinc-900 rounded font-semibold text-white">
                                    {u.roll_no}
                                  </span>
                                ) : (
                                  <span className="text-zinc-600 italic">Not set</span>
                                )}
                              </td>
                              <td className="p-3 text-zinc-300">
                                <span className="font-semibold text-white">{u.course || u.department || "B.Tech"}</span>
                                <span className="text-[10px] text-zinc-400 block font-mono">
                                  {[u.branch, u.semester].filter(Boolean).join(" · ") || u.college || "Student"}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="inline-flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${
                                      isBlocked
                                        ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                                        : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                    }`}
                                  >
                                    {isBlocked ? "Blocked" : "Active"}
                                  </span>
                                  <span className="px-1.5 py-0.5 border border-zinc-800 bg-zinc-900/80 text-[10px] uppercase font-mono text-zinc-400 rounded">
                                    {u.role}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  {/* View Details: Available to all Leads and Admins */}
                                  {(hasPermission("users.details") || isTeamLead || isAdminOnly) && (
                                    <button
                                      type="button"
                                      onClick={() => openUserDetailsModal(u.id)}
                                      className="px-2.5 py-1.5 border border-zinc-700 hover:border-white bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-all"
                                      title="View complete user details"
                                    >
                                      <Eye size={13} className="text-zinc-400 group-hover:text-white" />
                                      <span>View Details</span>
                                    </button>
                                  )}

                                  {/* Lead Quick Promote to Member in their respective team */}
                                  {!isAdminOnly && (isTeamLead || hasPermission("users.edit")) && (
                                    <button
                                      type="button"
                                      onClick={() => handleLeadDirectPromote(u)}
                                      className="px-2.5 py-1.5 border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black text-xs font-bold uppercase rounded transition-all"
                                      title={`Promote to Member in ${currentUser?.team || "Team"}`}
                                    >
                                      Promote
                                    </button>
                                  )}

                                  {/* Admin Full Hierarchy Promote & Role Editor */}
                                  {isAdminOnly && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingUser(u)}
                                      className="px-2.5 py-1.5 border border-white/20 hover:border-white bg-white/5 hover:bg-white text-zinc-200 hover:text-black text-xs font-semibold rounded transition-all"
                                    >
                                      Promote
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

                {/* Pagination Controls */}
                <div className="p-3 bg-zinc-900/40 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-zinc-400 text-xs font-mono">
                    Showing{" "}
                    <span className="font-bold text-white">
                      {usersPagination.total === 0 ? 0 : (usersPagination.current_page - 1) * usersPagination.per_page + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-white">
                      {Math.min(usersPagination.current_page * usersPagination.per_page, usersPagination.total)}
                    </span>{" "}
                    of <span className="font-bold text-white">{usersPagination.total}</span> registered users
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={usersPagination.current_page <= 1 || loadingCommunityUsers}
                      onClick={() => loadCommunityUsersPage(usersPagination.current_page - 1, searchQuery)}
                      className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed rounded flex items-center gap-1 text-xs font-medium transition-colors"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <span className="px-2 text-xs font-mono text-zinc-400">
                      Page <strong className="text-white">{usersPagination.current_page}</strong> of{" "}
                      <strong className="text-white">{usersPagination.last_page || 1}</strong>
                    </span>
                    <button
                      type="button"
                      disabled={usersPagination.current_page >= usersPagination.last_page || loadingCommunityUsers}
                      onClick={() => loadCommunityUsersPage(usersPagination.current_page + 1, searchQuery)}
                      className="px-3 py-1.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed rounded flex items-center gap-1 text-xs font-medium transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: APPLICATIONS & PROMOTIONS                           */}
          {/* ======================================================== */}
          {activeTab === "applications" && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-zinc-800">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Core Team Recruitment Applications
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Screen student submissions and promote candidates into official team wings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.length === 0 ? (
                  <div className="md:col-span-2 p-12 text-center border border-zinc-800 bg-zinc-950 text-zinc-500 font-mono text-xs">
                    No membership applications received yet.
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="p-4 border border-zinc-800 bg-zinc-950 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-zinc-500 uppercase">
                            TARGET: <span className="text-white font-bold">{app.target_team}</span>
                          </span>
                          <span className="px-2 py-0.5 border border-zinc-700 text-[10px] uppercase">
                            {app.status}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white">{app.name}</h3>
                        <p className="text-[11px] text-zinc-400 mb-3">{app.email} · {app.phone || "No phone"}</p>

                        <div className="p-2.5 border border-zinc-800 bg-zinc-900 space-y-1 text-xs text-zinc-300 mb-3">
                          <div><span className="text-zinc-500 uppercase text-[10px]">Academic:</span> {app.roll_no} ({app.department})</div>
                          <div><span className="text-zinc-500 uppercase text-[10px]">Applying For:</span> {app.target_position}</div>
                          {app.github_url && (
                            <div>
                              <span className="text-zinc-500 uppercase text-[10px]">GitHub:</span>{" "}
                              <a href={app.github_url} target="_blank" rel="noreferrer" className="text-white underline">
                                {app.github_url}
                              </a>
                            </div>
                          )}
                        </div>

                        {app.statement_of_purpose && (
                          <div className="mb-3">
                            <span className="text-[10px] text-zinc-500 uppercase block mb-1">Statement:</span>
                            <p className="text-xs text-zinc-400 bg-zinc-900 p-2 border border-zinc-800 italic">
                              "{app.statement_of_purpose}"
                            </p>
                          </div>
                        )}
                      </div>

                      {(hasPermission("applications.promote") || hasPermission("applications.reject")) && app.status === "Pending" && (
                        <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
                          {hasPermission("applications.promote") && (
                            <button
                              onClick={() => {
                                setPromotingApp(app);
                                setPromoteTeam(app.target_team || "Technical");
                                setPromotePosition(app.target_position || "Core Member");
                              }}
                              className="flex-1 py-1.5 bg-white text-black font-bold uppercase text-[10px] tracking-wider hover:bg-zinc-200 transition-colors"
                            >
                              Promote to Member
                            </button>
                          )}
                          {hasPermission("applications.reject") && (
                            <button
                              onClick={() => handleRejectApp(app.id)}
                              className="px-3 py-1.5 border border-zinc-800 hover:border-red-500 text-[10px] uppercase text-zinc-400 hover:text-red-400 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: ROLES & PERMISSIONS (RBAC)                           */}
          {/* ======================================================== */}
          {activeTab === "rbac" && (
            isAdminOnly ? (
              <RBACTab />
            ) : (
              <div className="p-12 text-center border border-zinc-800 bg-zinc-950 text-zinc-500 font-mono text-xs">
                Access Restricted. Only System Administrators can access Roles & Permissions governance.
              </div>
            )
          )}

          {/* ======================================================== */}
          {/* TAB: SETTINGS & DYNAMIC TAXONOMY MANAGEMENT              */}
          {/* ======================================================== */}
          {activeTab === "settings" && (
            isAdminOnly ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    Dynamic Settings & Taxonomy Management
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    Add, edit, and organize dynamic options (Roles, Positions, Teams, Colleges, Courses, Branches, Semesters).
                  </p>
                </div>

                {isPresidentOrVP && (
                  <button
                    onClick={() =>
                      setEditingSetting({
                        type: selectedSettingCategory,
                        name: "",
                        group: "",
                        description: "",
                        sort_order: 1,
                        is_active: true,
                      })
                    }
                    className="px-3 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Add New {selectedSettingCategory}</span>
                  </button>
                )}
              </div>

              {/* Taxonomy Sub-Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-850">
                {taxonomyCategories.map((cat) => {
                  const isSelected = selectedSettingCategory === cat.key;
                  const catCount = isSelected
                    ? settings.length
                    : allTaxonomies.filter((s) => s.type === cat.key).length;
                  return (
                    <Link
                      key={cat.key}
                      to={`/dashboard/settings/${cat.slug}`}
                      className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-white text-black font-bold border-white"
                          : "border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? "bg-black text-white" : "bg-zinc-850 text-zinc-400"
                      }`}>
                        {catCount}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Table of Selected Taxonomy Settings with Drag & Drop */}
              <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3 w-10 text-center"></th>
                        <th className="p-3 w-16">Order</th>
                        <th className="p-3">Name / Label</th>
                        {selectedSettingCategory === "position" && <th className="p-3">Assigned Team Group</th>}
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {settings.length === 0 ? (
                        <tr>
                          <td colSpan={selectedSettingCategory === "position" ? 6 : 5} className="p-8 text-center text-zinc-500 font-mono text-xs">
                            No options defined for "{selectedSettingCategory}". Click "Add New {selectedSettingCategory}" to create one.
                          </td>
                        </tr>
                      ) : (
                        settings.map((item, idx) => {
                          const isBeingDragged = draggedSettingIndex === idx;
                          return (
                            <tr
                              key={item.id}
                              draggable={isPresidentOrVP}
                              onDragStart={() => handleSettingDragStart(idx)}
                              onDragOver={handleSettingDragOver}
                              onDrop={() => handleSettingDrop(idx)}
                              className={`transition-colors select-none ${
                                isBeingDragged ? "opacity-30 bg-zinc-800/80" : "hover:bg-zinc-900/60"
                              } ${isPresidentOrVP ? "cursor-grab active:cursor-grabbing" : ""}`}
                            >
                              <td className="p-3 text-center text-zinc-600 hover:text-zinc-300 w-10">
                                {isPresidentOrVP && <GripVertical size={14} className="mx-auto" />}
                              </td>
                              <td className="p-3 text-zinc-400 font-mono text-[11px] w-16">
                                #{item.sort_order}
                              </td>
                              <td className="p-3 font-bold text-white">
                                <span>{item.name}</span>
                                {item.description && (
                                  <span className="text-[10px] text-zinc-500 block font-normal">{item.description}</span>
                                )}
                              </td>
                              {selectedSettingCategory === "position" && (
                                <td className="p-3 text-zinc-300">
                                  <span className="px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-[11px]">
                                    {item.group || "General"}
                                  </span>
                                </td>
                              )}
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 border text-[10px] uppercase ${
                                    item.is_active
                                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                      : "border-zinc-800 text-zinc-500"
                                  }`}
                                >
                                  {item.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {isPresidentOrVP && (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => setEditingSetting(item)}
                                      className="px-2 py-1 border border-zinc-700 hover:border-white text-[10px] uppercase text-zinc-300"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteSettingSubmit(item.id)}
                                      className="px-2 py-1 border border-zinc-800 hover:border-red-500 text-[10px] uppercase text-zinc-400 hover:text-red-400"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            ) : (
              <div className="p-12 text-center border border-zinc-800 bg-zinc-950 text-zinc-500 font-mono text-xs">
                Access Restricted. Only System Administrators can access Dynamic Settings.
              </div>
            )
          )}

          {/* ======================================================== */}
          {/* TAB: MY CART / PURCHASED THINGS HISTORY                  */}
          {/* ======================================================== */}
          {activeTab === "cart" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    My Cart & Purchase History
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    All official merchandise, hoodies, stickers, and swag requests you have pre-ordered.
                  </p>
                </div>

                <Link
                  to="/store"
                  className="px-3 py-1.5 bg-white text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                >
                  <ShoppingBag size={14} />
                  <span>Visit Store</span>
                </Link>
              </div>

              {/* Table of Orders */}
              <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Order Number</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Size / Qty</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Pickup Token</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {!userSummary?.orders || userSummary.orders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-zinc-500 text-xs">
                            You have no store purchases or swag orders yet.{" "}
                            <Link to="/store" className="text-white underline ml-1">
                              Browse CodeZen Store
                            </Link>
                          </td>
                        </tr>
                      ) : (
                        userSummary.orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-zinc-900/50">
                            <td className="p-3 font-bold text-white">{ord.order_number}</td>
                            <td className="p-3 text-zinc-200">{ord.product_name}</td>
                            <td className="p-3 text-zinc-400">{ord.category || "Swag"}</td>
                            <td className="p-3 text-zinc-300">
                              {ord.size || "Standard"} &times; {ord.quantity}
                            </td>
                            <td className="p-3 text-zinc-400">₹{ord.price}</td>
                            <td className="p-3 font-bold text-white">₹{ord.total_amount}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-300 text-[10px]">
                                {ord.pickup_token || "-"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
                                  ord.status === "Fulfilled" || ord.status === "Confirmed"
                                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                    : "border-zinc-700 text-zinc-400 bg-zinc-900"
                                }`}
                              >
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: PROFILE (EDIT DETAILS)                              */}
          {/* ======================================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-4xl">
              <div className="pb-3 border-b border-zinc-800">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  User Profile & Account Details
                </h2>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Update your contact details, academic information, and developer profile.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* 1. Basic Info */}
                <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-2">
                    01. Personal Information & Profile Photo
                  </div>

                  {/* Profile Avatar Upload with Cloudinary */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-zinc-900/50 border border-zinc-850">
                    <div className="relative group shrink-0">
                      {profileFormData.avatar || currentUser?.avatar ? (
                        <img
                          src={profileFormData.avatar || currentUser?.avatar || ""}
                          alt={profileFormData.name || currentUser?.name || "Avatar"}
                          className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-md group-hover:border-white transition-colors"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-750 flex items-center justify-center text-xl font-bold text-white shadow-md">
                          {(profileFormData.name || currentUser?.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/75 rounded-full flex items-center justify-center">
                          <Loader2 size={22} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                          avatarUploading
                            ? "bg-zinc-800 text-zinc-500 border-zinc-750 cursor-not-allowed"
                            : "bg-white hover:bg-zinc-200 text-black border-white"
                        }`}>
                          {avatarUploading ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Uploading to Cloudinary...</span>
                            </>
                          ) : (
                            <>
                              <Camera size={14} />
                              <span>Upload New Photo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={avatarUploading}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 10 * 1024 * 1024) {
                                showFeedback("File size must be under 10MB");
                                return;
                              }
                              setAvatarUploading(true);
                              try {
                                const url = await uploadToCloudinary(file);
                                setProfileFormData((prev) => ({ ...prev, avatar: url }));
                                showFeedback("Photo uploaded to Cloudinary! Click Save Profile to persist.");
                              } catch (err: any) {
                                showFeedback(err?.message || "Failed to upload image to Cloudinary.");
                              } finally {
                                setAvatarUploading(false);
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>

                        {profileFormData.avatar && (
                          <button
                            type="button"
                            onClick={() => setProfileFormData((prev) => ({ ...prev, avatar: "" }))}
                            className="px-3 py-2 text-xs font-mono text-red-400 hover:text-red-300 border border-red-950/60 hover:border-red-900 bg-red-950/20"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        Supports JPG, PNG, WEBP, or GIF up to 10MB. Hosted securely on Cloudinary CDN.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={profileFormData.name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Email Address (Read-only)</label>
                      <input
                        type="email"
                        disabled
                        value={currentUser?.email || ""}
                        className="w-full p-2.5 bg-zinc-900/50 border border-zinc-800/60 text-zinc-500 text-xs cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 9876543210"
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Roll Number / Student ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 2418901"
                        value={profileFormData.roll_no}
                        onChange={(e) => setProfileFormData({ ...profileFormData, roll_no: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Academic Info */}
                <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-2">
                    02. Academic Enrollment
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">University</label>
                      <select
                        value={profileFormData.university}
                        onChange={(e) => setProfileFormData({ ...profileFormData, university: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white"
                      >
                        <option value="">Select University</option>
                        {academicOptions.universities.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">College</label>
                      <select
                        value={profileFormData.college}
                        onChange={(e) => setProfileFormData({ ...profileFormData, college: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white"
                      >
                        <option value="">Select College</option>
                        {academicOptions.colleges.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Course</label>
                      <select
                        value={profileFormData.course}
                        onChange={(e) => setProfileFormData({ ...profileFormData, course: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white"
                      >
                        <option value="">Select Course</option>
                        {academicOptions.courses.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Department</label>
                      <select
                        value={profileFormData.department}
                        onChange={(e) => setProfileFormData({ ...profileFormData, department: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white"
                      >
                        <option value="">Select Department</option>
                        {academicOptions.departments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Branch / Specialization</label>
                      <select
                        value={profileFormData.branch}
                        onChange={(e) => setProfileFormData({ ...profileFormData, branch: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white"
                      >
                        <option value="">Select Branch</option>
                        {academicOptions.branches.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Semester</label>
                      <select
                        value={profileFormData.semester}
                        onChange={(e) => setProfileFormData({ ...profileFormData, semester: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white"
                      >
                        <option value="">Select Semester</option>
                        {dynamicSemesters.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Developer Bio & Links */}
                <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850 pb-2">
                    03. Public Presence & Links
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">Bio / Intro</label>
                    <textarea
                      rows={3}
                      placeholder="Share a short bio or your tech interests..."
                      value={profileFormData.bio}
                      onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">GitHub Profile URL</label>
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={profileFormData.github}
                        onChange={(e) => setProfileFormData({ ...profileFormData, github: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={profileFormData.linkedin}
                        onChange={(e) => setProfileFormData({ ...profileFormData, linkedin: e.target.value })}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white transition-colors font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{profileSaving ? "Saving..." : "Save Profile Details"}</span>
                  </button>
                </div>
              </form>

              {/* 4. Password Security Management (Direct New & Confirm) */}
              <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <KeyRound size={14} className="text-white" />
                      <span>04. Security & Account Password</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Directly change your portal login password. No current password required.
                    </p>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs flex items-center gap-2">
                    <Ban size={14} className="shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-mono">
                          New Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 font-mono"
                        >
                          {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                          <span>{showPassword ? "Hide" : "Show"}</span>
                        </button>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Enter new password (min. 6 chars)"
                        value={passwordFormData.password}
                        onChange={(e) => {
                          setPasswordError("");
                          setPasswordFormData({ ...passwordFormData, password: e.target.value });
                        }}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-mono">
                        Confirm New Password *
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Re-type new password"
                        value={passwordFormData.password_confirmation}
                        onChange={(e) => {
                          setPasswordError("");
                          setPasswordFormData({ ...passwordFormData, password_confirmation: e.target.value });
                        }}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-white transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={passwordSaving || !passwordFormData.password}
                      className="px-5 py-2.5 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <KeyRound size={13} />
                      <span>{passwordSaving ? "Updating Password..." : "Change Password"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* MODALS (STANDARD B&W DIALOGS)                            */}
      {/* ======================================================== */}

      {/* EDIT USER ROLE & PROFILE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-black border border-zinc-700 w-full max-w-lg p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                  Edit User: {editingUser.name || "Member"}
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">{editingUser.email}</span>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Sub-tabs to switch between Profile Details & Hierarchy/Roles */}
            <div className="flex border-b border-zinc-800 mb-4 gap-2">
              <button
                type="button"
                onClick={() => setEditingUserTab("profile")}
                className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  editingUserTab === "profile"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Personal & Academic
              </button>
              <button
                type="button"
                onClick={() => setEditingUserTab("hierarchy")}
                className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  editingUserTab === "hierarchy"
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Role & Hierarchy
              </button>
            </div>

            <form onSubmit={saveUserHierarchy} className="space-y-3 text-xs">
              {editingUserTab === "profile" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editingUser.name || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="user@example.com"
                        value={editingUser.email || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 9876543210"
                        value={editingUser.phone || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Roll / Student ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 2104829"
                        value={editingUser.roll_no || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, roll_no: e.target.value })}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">College / Institution</label>
                    <select
                      value={editingUser.college || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, college: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                    >
                      <option value="">Select College</option>
                      {dynamicColleges.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Course / Degree</label>
                      <select
                        value={editingUser.course || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, course: e.target.value })}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                      >
                        <option value="">Select Course</option>
                        {dynamicCourses.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Branch / Specialization</label>
                      <select
                        value={editingUser.branch || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, branch: e.target.value })}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                      >
                        <option value="">Select Branch</option>
                        {dynamicBranches.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Semester</label>
                      <select
                        value={editingUser.semester || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, semester: e.target.value })}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                      >
                        <option value="">Select Semester</option>
                        {dynamicSemesters.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Department</label>
                      <select
                        value={editingUser.department || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                        className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                      >
                        <option value="">Select Department</option>
                        {dynamicDepartments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {editingUserTab === "hierarchy" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Portal Role</label>
                    <select
                      value={editingUser.role || "User"}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                    >
                      {dynamicRoles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Type (Tier)</label>
                    <select
                      value={editingUser.type || "User"}
                      onChange={(e) => setEditingUser({ ...editingUser, type: e.target.value as any })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                    >
                      {dynamicTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Team Wing</label>
                    <select
                      value={editingUser.team || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, team: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                    >
                      <option value="">None (Community User)</option>
                      {dynamicTeams.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Designated Position</label>
                    <input
                      type="text"
                      list="dynamic-positions-list"
                      placeholder="e.g. President, Vice President, Faculty Coordinator, Tech Lead..."
                      value={editingUser.position || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                    />
                    <datalist id="dynamic-positions-list">
                      {dynamicPositions.map((pos) => (
                        <option key={pos.id} value={pos.name} />
                      ))}
                    </datalist>
                  </div>

                  {/* QR Scanner Permission Toggle */}
                  <div className="p-3 border border-zinc-800 bg-zinc-900/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-white block">QR Code Scanner Permission</span>
                        <span className="text-[10px] text-zinc-500 block">
                          Allow this user to access the QR scanner and check in event attendees
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editingUser.can_scan_qr}
                          onChange={(e) => setEditingUser({ ...editingUser, can_scan_qr: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                      </label>
                    </div>
                  </div>

                  {/* Show On Website & Display Order Controls */}
                  <div className="p-3 border border-zinc-800 bg-zinc-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-white block">Show on Website</span>
                        <span className="text-[10px] text-zinc-500 block">
                          Feature this leader in the public Website Leadership section
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editingUser.show_on_website}
                          onChange={(e) => setEditingUser({ ...editingUser, show_on_website: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                      </label>
                    </div>

                    {editingUser.show_on_website && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                            Display Order (1=P, 2=VP, 3=FC)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={editingUser.website_order || 1}
                            onChange={(e) => setEditingUser({ ...editingUser, website_order: parseInt(e.target.value) || 1 })}
                            className="w-full p-2 bg-black border border-zinc-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                            Avatar Photo (Cloudinary or URL)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="/leader-president.jpg or https://res.cloudinary.com/..."
                              value={editingUser.avatar || ""}
                              onChange={(e) => setEditingUser({ ...editingUser, avatar: e.target.value })}
                              className="w-full p-2 bg-black border border-zinc-800 text-white text-xs font-mono"
                            />
                            <label className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-zinc-700 shrink-0 inline-flex items-center gap-1">
                              <Upload size={12} />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    showFeedback("Uploading photo to Cloudinary...");
                                    const url = await uploadToCloudinary(file);
                                    setEditingUser((prev) => prev ? { ...prev, avatar: url } : null);
                                    showFeedback("Photo uploaded successfully!");
                                  } catch (err: any) {
                                    showFeedback(err?.message || "Failed to upload photo.");
                                  } finally {
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-white text-black font-bold uppercase text-xs hover:bg-zinc-200"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-zinc-800 hover:border-zinc-600 text-xs text-zinc-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div data-lenis-prevent className="bg-black border border-zinc-700 w-full max-w-2xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 shrink-0">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  {editingEvent.id ? `Edit Event Record: ${editingEvent.code || ""}` : "Create New Event Record"}
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Configure logistics, timeline, speakers, prizes, tags, and registration controls.
                </p>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveEventSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 overscroll-contain" data-lenis-prevent>
              {/* SECTION 1: CORE IDENTIFIERS */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-1">
                  <span>01. Core Identity & Classification</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CZ-HACK-01"
                      value={editingEvent.code || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, code: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Type *</label>
                    <select
                      value={editingEvent.type || "Workshop"}
                      onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value as any })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    >
                      {["Hackathon", "Bootcamp", "Workshop", "Challenge", "Contest", "Code Race"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Visibility</label>
                    <select
                      value={editingEvent.visibility || "Public"}
                      onChange={(e) => setEditingEvent({ ...editingEvent, visibility: e.target.value as any })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    >
                      <option value="Public">Public (Show on Website)</option>
                      <option value="Private">Private (Internal Only)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CODEZEN HACKATHON 4.0: SYNAPSE"
                    value={editingEvent.title || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. 36-Hour Non-stop Engineering & Rapid Prototyping Flagship Sprint."
                    value={editingEvent.tagline || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, tagline: e.target.value })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Detailed briefing or scope of the sprint..."
                    value={editingEvent.description || ""}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              {/* SECTION 2: SCHEDULE & DURATION */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-1">
                  <span>02. Schedule, Duration & Timing</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Start Date</label>
                    <input
                      type="text"
                      placeholder="e.g. MAR 20, 2026"
                      value={editingEvent.start_date || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">End Date</label>
                    <input
                      type="text"
                      placeholder="e.g. MAR 22, 2026"
                      value={editingEvent.end_date || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00 AM IST Onwards"
                      value={editingEvent.time || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 36 Hours / 2 Days"
                      value={editingEvent.duration || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, duration: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: VENUE, LOCATION & SEATS */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-1">
                  <span>03. Venue, Location Details & Capacity</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Mode</label>
                    <select
                      value={editingEvent.mode || "Offline"}
                      onChange={(e) => setEditingEvent({ ...editingEvent, mode: e.target.value as any })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    >
                      {["Offline", "Online", "Hybrid"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Format</label>
                    <select
                      value={editingEvent.participation || "Single"}
                      onChange={(e) => setEditingEvent({ ...editingEvent, participation: e.target.value as any })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    >
                      {["Single", "Team", "Single or Team"].map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Team Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 - 4 Members"
                      value={editingEvent.team_size || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, team_size: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Venue (General)</label>
                    <input
                      type="text"
                      placeholder="e.g. CGC Central Auditorium Complex"
                      value={editingEvent.venue || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Location Details</label>
                    <input
                      type="text"
                      placeholder="e.g. Hall A, 3rd Floor or Discord Room"
                      value={editingEvent.location_details || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, location_details: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Seats / Capacity</label>
                    <input
                      type="text"
                      placeholder="e.g. 80 Teams (320 Seats)"
                      value={editingEvent.seats || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, seats: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: INCENTIVES, PERKS & TAGS */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-1">
                  <span>04. Prize Pool, Perks & Tags</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Prize Pool</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹50,000 INR Pool + Cloud Credits"
                      value={editingEvent.prize_pool || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, prize_pool: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                      Perks <span className="text-zinc-600 lowercase">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. T-Shirts, Certificates, Cloud Credits, Food"
                      value={Array.isArray(editingEvent.perks) ? editingEvent.perks.join(", ") : (editingEvent.perks || "")}
                      onChange={(e) => setEditingEvent({ ...editingEvent, perks: e.target.value.split(",").map(s => s.trim()) })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">
                      Tags <span className="text-zinc-600 lowercase">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hackathon, Full-Stack, AI, Open Source"
                      value={Array.isArray(editingEvent.tags) ? editingEvent.tags.join(", ") : (editingEvent.tags || "")}
                      onChange={(e) => setEditingEvent({ ...editingEvent, tags: e.target.value.split(",").map(s => s.trim()) })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: MEDIA & REGISTRATION OVERRIDE */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-1">
                  <span>05. Media & Registration URL</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Banner Image Path / URL</label>
                    <input
                      type="text"
                      placeholder="e.g. /card-hackathon.jpg or https://..."
                      value={editingEvent.banner_img || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, banner_img: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                    <div className="flex gap-2 mt-1">
                      {["/card-hackathon.jpg", "/card-learning.jpg", "/card-domains.jpg"].map((img) => (
                        <button
                          key={img}
                          type="button"
                          onClick={() => setEditingEvent({ ...editingEvent, banner_img: img })}
                          className="text-[9px] text-zinc-500 hover:text-white underline font-mono"
                        >
                          {img.replace("/", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Custom Registration URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://unstop.com/... or leave blank for internal"
                      value={editingEvent.registration_url || ""}
                      onChange={(e) => setEditingEvent({ ...editingEvent, registration_url: e.target.value })}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white font-mono"
                    />
                    <span className="text-[9px] text-zinc-500 block mt-1">
                      Leave empty to use CodeZen's internal 1-click registration modal.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 6: SPEAKERS / GUESTS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    06. Speakers & Guests ({editingEvent.speakers?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingEvent.speakers || [];
                      setEditingEvent({
                        ...editingEvent,
                        speakers: [
                          ...current,
                          { name: "", role: "Keynote Speaker", companyOrOrg: "CodeZen", avatar: "/avatar-1.jpg" },
                        ],
                      });
                    }}
                    className="px-2 py-0.5 border border-zinc-800 hover:border-white text-[10px] text-zinc-300 uppercase inline-flex items-center gap-1"
                  >
                    <Plus size={11} />
                    <span>Add Speaker</span>
                  </button>
                </div>

                {(!editingEvent.speakers || editingEvent.speakers.length === 0) ? (
                  <div className="p-3 border border-dashed border-zinc-800 text-center text-zinc-500 text-[11px]">
                    No speakers added yet. Click "+ Add Speaker" above to feature mentors or keynote guests.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingEvent.speakers.map((spk, idx) => (
                      <div key={idx} className="p-2.5 bg-zinc-950 border border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase block">Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Alex Rivera"
                            value={spk.name || ""}
                            onChange={(e) => {
                              const updated = [...(editingEvent.speakers || [])];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setEditingEvent({ ...editingEvent, speakers: updated });
                            }}
                            className="w-full p-1.5 bg-zinc-900 border border-zinc-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase block">Role / Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Senior Staff Engineer"
                            value={spk.role || ""}
                            onChange={(e) => {
                              const updated = [...(editingEvent.speakers || [])];
                              updated[idx] = { ...updated[idx], role: e.target.value };
                              setEditingEvent({ ...editingEvent, speakers: updated });
                            }}
                            className="w-full p-1.5 bg-zinc-900 border border-zinc-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase block">Company / Org</label>
                          <input
                            type="text"
                            placeholder="e.g. Google Cloud"
                            value={spk.companyOrOrg || ""}
                            onChange={(e) => {
                              const updated = [...(editingEvent.speakers || [])];
                              updated[idx] = { ...updated[idx], companyOrOrg: e.target.value };
                              setEditingEvent({ ...editingEvent, speakers: updated });
                            }}
                            className="w-full p-1.5 bg-zinc-900 border border-zinc-800 text-white text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1">
                            <label className="text-[9px] text-zinc-500 uppercase block">Avatar Path</label>
                            <input
                              type="text"
                              placeholder="/avatar-1.jpg"
                              value={spk.avatar || ""}
                              onChange={(e) => {
                                const updated = [...(editingEvent.speakers || [])];
                                updated[idx] = { ...updated[idx], avatar: e.target.value };
                                setEditingEvent({ ...editingEvent, speakers: updated });
                              }}
                              className="w-full p-1.5 bg-zinc-900 border border-zinc-800 text-white text-xs font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingEvent.speakers || []).filter((_, i) => i !== idx);
                              setEditingEvent({ ...editingEvent, speakers: updated });
                            }}
                            className="mt-3 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                            title="Remove Speaker"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 7: LIFECYCLE & REGISTRATION LOCK */}
              <div className="p-3 border border-zinc-800 bg-zinc-900/60 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Lifecycle Status</label>
                  <select
                    value={editingEvent.status || "UPCOMING"}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  >
                    {["REGISTRATION OPEN", "UPCOMING", "LIVE NOW", "CONCLUDED"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-semibold text-white block">Registration Status</span>
                    <span className="text-[10px] text-zinc-500 block">
                      {editingEvent.registration_open !== false ? "Open for new participants" : "Locked / Registrations paused"}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingEvent.registration_open !== false}
                      onChange={(e) => setEditingEvent({ ...editingEvent, registration_open: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                  </label>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-3 border-t border-zinc-800 flex gap-2 shrink-0">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-white text-black font-bold uppercase text-xs tracking-wider hover:bg-zinc-200 transition-colors"
                >
                  Save Event Record
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-5 py-2.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors uppercase text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STORE PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-black border border-zinc-700 w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-xs font-bold uppercase text-white">
                {editingProduct.id ? "Edit Product" : "Add Store Item"}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveProductSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category || "Apparel"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Status</label>
                  <select
                    value={editingProduct.status || "Active"}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1799"
                    value={editingProduct.original_price || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, original_price: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Sizes / Variants (comma separated)</label>
                  <input
                    type="text"
                    placeholder="S, M, L, XL"
                    value={Array.isArray(editingProduct.sizes) ? editingProduct.sizes.join(", ") : (editingProduct.sizes || "")}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sizes: e.target.value.split(",").map(s => s.trim()) })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Image URL / Path</label>
                <input
                  type="text"
                  placeholder="e.g. /card-hackathon.jpg or /logo.png"
                  value={editingProduct.image_url || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Product specifications..."
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-white text-black font-bold uppercase text-xs hover:bg-zinc-200"
                >
                  Save Item
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTE APPLICANT MODAL */}
      {promotingApp && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-black border border-zinc-700 w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-xs font-bold uppercase text-white">Promote to Core Team Member</h3>
              <button onClick={() => setPromotingApp(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-3">
              Promoting <span className="text-white font-bold">{promotingApp.name}</span> ({promotingApp.email}).
            </p>

            <form onSubmit={handlePromoteApp} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Target Team Wing</label>
                <select
                  value={promoteTeam}
                  onChange={(e) => setPromoteTeam(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                >
                  {dynamicTeams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Designated Position Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Developer, Event Coordinator"
                  value={promotePosition}
                  onChange={(e) => setPromotePosition(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Reviewer Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes for audit log..."
                  value={promoteNotes}
                  onChange={(e) => setPromoteNotes(e.target.value)}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-white text-black font-bold uppercase text-xs hover:bg-zinc-200"
                >
                  Confirm & Promote
                </button>
                <button
                  type="button"
                  onClick={() => setPromotingApp(null)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW EVENT REGISTRATIONS MODAL */}
      {viewingRegistrationsEvent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-black border border-zinc-700 w-full max-w-xl p-5 shadow-2xl relative max-h-[85vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase text-white">Event Registrations</h3>
                <p className="text-[10px] text-zinc-500">{viewingRegistrationsEvent.title}</p>
              </div>
              <button onClick={() => setViewingRegistrationsEvent(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {eventRegistrations.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-zinc-800 text-zinc-500 text-xs">
                No attendee registrations recorded for this sprint yet.
              </div>
            ) : (
              <div className="border border-zinc-800 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="p-2.5">Attendee</th>
                      <th className="p-2.5">Roll No / College</th>
                      <th className="p-2.5">Unique QR Token</th>
                      <th className="p-2.5">Attendance</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {eventRegistrations.map((reg) => {
                      const isPresent = (reg.attendance_status || "").toLowerCase() === "present";
                      return (
                        <tr key={reg.id} className="hover:bg-zinc-900/50">
                          <td className="p-2.5">
                            <span className="font-bold text-white block">{reg.user_name}</span>
                            <span className="text-zinc-500 text-[10px]">{reg.user_email}</span>
                          </td>
                          <td className="p-2.5 text-zinc-300">
                            <span>{reg.roll_no || "-"}</span>
                            <span className="text-zinc-500 block text-[10px]">{reg.college || "-"}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-300">
                              {reg.qr_token || "CZ-EV" + reg.event_id + "-U" + reg.user_id}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 border text-[10px] uppercase font-bold tracking-wider inline-flex items-center gap-1 ${
                                isPresent
                                  ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                                  : "border-red-500/30 text-red-400 bg-red-500/10"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-emerald-400" : "bg-red-400"}`} />
                              <span>{isPresent ? "Present" : "Absent"}</span>
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {hasPermission("scanner.checkin") && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const newStatus = isPresent ? "Absent" : "Present";
                                    try {
                                      const res = await apiFetch("/admin/events/attendance", {
                                        method: "POST",
                                        body: JSON.stringify({
                                          qr_token: reg.qr_token,
                                          status: newStatus,
                                        }),
                                      });
                                      const data = await res.json();
                                      if (res.ok) {
                                        showFeedback(data.message || `Marked as ${newStatus}`);
                                        setEventRegistrations((prev) =>
                                          prev.map((r) =>
                                            r.id === reg.id ? { ...r, attendance_status: newStatus } : r
                                          )
                                        );
                                      } else {
                                        showFeedback(data.error || "Failed to mark attendance");
                                      }
                                    } catch {
                                      showFeedback("Network error marking attendance");
                                    }
                                  }}
                                  className={`px-2.5 py-1 text-[10px] uppercase font-bold border transition-colors ${
                                    isPresent
                                      ? "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 bg-zinc-900"
                                      : "border-emerald-500 text-black bg-emerald-400 hover:bg-emerald-300"
                                  }`}
                                >
                                  {isPresent ? "Mark Absent" : "Mark Present"}
                                </button>
                              )}

                              {hasPermission("events.registrations.delete") && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to remove ${reg.user_name} from this event?`)) return;
                                    try {
                                      const res = await apiFetch(`/admin/events/registrations/${reg.id}`, { method: "DELETE" });
                                      const data = await res.json();
                                      if (res.ok) {
                                        showFeedback(data.message || "Registration deleted.");
                                        setEventRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
                                        setEvents((prev) =>
                                          prev.map((ev) =>
                                            ev.id === viewingRegistrationsEvent.id
                                              ? { ...ev, registrations_count: Math.max(0, (ev.registrations_count || 1) - 1) }
                                              : ev
                                          )
                                        );
                                      } else {
                                        showFeedback(data.error || "Failed to delete registration");
                                      }
                                    } catch {
                                      showFeedback("Network error deleting registration");
                                    }
                                  }}
                                  className="p-1 border border-zinc-800 hover:border-rose-500/50 bg-zinc-900 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors"
                                  title="Delete registration"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT / CREATE SETTING MODAL */}
      {editingSetting && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-black border border-zinc-700 w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-xs font-bold uppercase text-white">
                {editingSetting.id ? "Edit Taxonomy Option" : `Add New ${editingSetting.type || "Option"}`}
              </h3>
              <button onClick={() => setEditingSetting(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={saveSettingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Taxonomy Type</label>
                <select
                  value={editingSetting.type}
                  onChange={(e) => setEditingSetting({ ...editingSetting, type: e.target.value })}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                >
                  <option value="role">Role</option>
                  <option value="type">Type (Tier)</option>
                  <option value="position">Position</option>
                  <option value="team">Team / Wing</option>
                  <option value="university">University</option>
                  <option value="college">College</option>
                  <option value="department">Department</option>
                  <option value="course">Course</option>
                  <option value="branch">Branch</option>
                  <option value="semester">Semester</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Option Name / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead, Computer Science, CEC Landran..."
                  value={editingSetting.name || ""}
                  onChange={(e) => setEditingSetting({ ...editingSetting, name: e.target.value })}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                />
              </div>

              {editingSetting.type === "position" && (
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Associated Team / Wing</label>
                  <select
                    value={editingSetting.group || ""}
                    onChange={(e) => setEditingSetting({ ...editingSetting, group: e.target.value })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                  >
                    <option value="">General / All Teams</option>
                    {dynamicTeams.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={editingSetting.sort_order || 1}
                    onChange={(e) => setEditingSetting({ ...editingSetting, sort_order: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Status</label>
                  <select
                    value={editingSetting.is_active ? "1" : "0"}
                    onChange={(e) => setEditingSetting({ ...editingSetting, is_active: e.target.value === "1" })}
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief note or description..."
                  value={editingSetting.description || ""}
                  onChange={(e) => setEditingSetting({ ...editingSetting, description: e.target.value })}
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 text-white outline-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-white text-black font-bold uppercase text-xs hover:bg-zinc-200"
                >
                  Save Option
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSetting(null)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER ATTENDEE TICKET & QR PASS MODAL (AUTHENTIC TICKET STUB DESIGN - FIT IN SCREEN VH) */}
      {activeTicketModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div data-lenis-prevent className="relative w-full max-w-[340px] max-h-[92vh] flex flex-col filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button Floating */}
            <button
              onClick={() => setActiveTicketModal(null)}
              className="absolute -top-2.5 -right-2.5 z-30 w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white flex items-center justify-center transition-colors shadow-lg"
              title="Close Ticket Pass"
            >
              <X size={14} />
            </button>

            {/* Ticket Card Container with Notched Perforation & Scrollable Body within Screen */}
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl font-mono flex flex-col max-h-[92vh]">
              
              {/* TOP SECTION: EVENT BANNER & BRANDING */}
              <div className="px-4 py-3 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-b border-zinc-850/60 relative shrink-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                    <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
                      Official Entry Pass
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.5 border border-zinc-800 rounded">
                    {activeTicketModal.event_code}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold uppercase text-white tracking-tight leading-snug line-clamp-1">
                  {activeTicketModal.event_title}
                </h3>
                
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400">
                  <span className="text-zinc-300 font-semibold">{activeTicketModal.event_type}</span>
                  <span>•</span>
                  <span className="text-zinc-500 uppercase">{activeTicketModal.mode}</span>
                </div>
              </div>

              {/* SCROLLABLE INNER SECTION IF SCREEN HEIGHT IS VERY SHORT */}
              <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {/* MIDDLE SECTION: TICKET QR STUB WITH GLOW */}
                <div className="py-3 px-3 bg-zinc-950 text-center flex flex-col items-center justify-center relative">
                  <div className="p-2.5 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.06)] border-2 border-zinc-900 inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        activeTicketModal.qr_token || `CZ-EV${activeTicketModal.event_id}-U${activeTicketModal.registration_id}`
                      )}`}
                      alt="Ticket QR Code"
                      className="w-32 h-32 sm:w-36 sm:h-36 mx-auto block rounded"
                    />
                  </div>

                  <div className="mt-2">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">
                      Scan At Entrance Gate
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-300 bg-zinc-900 px-2.5 py-0.5 border border-zinc-800 rounded-full inline-block mt-0.5">
                      {activeTicketModal.qr_token || `REG-${activeTicketModal.registration_id}-CZ`}
                    </span>
                  </div>
                </div>

                {/* TICKET PERFORATION DIVIDER WITH SEMI-CIRCLE NOTCHES */}
                <div className="relative flex items-center justify-between px-0 my-0.5 shrink-0">
                  {/* Left Hole Notch */}
                  <div className="w-5 h-5 -ml-2.5 rounded-full bg-black border-r border-zinc-800 z-10 shadow-inner" />
                  
                  {/* Dashed Tear Line */}
                  <div className="flex-1 border-b-2 border-dashed border-zinc-800 mx-1.5" />
                  
                  {/* Right Hole Notch */}
                  <div className="w-5 h-5 -mr-2.5 rounded-full bg-black border-l border-zinc-800 z-10 shadow-inner" />
                </div>

                {/* BOTTOM SECTION: TICKET METADATA STUB */}
                <div className="p-4 bg-zinc-950 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase font-mono block">Attendee</span>
                      <span className="font-bold text-white text-[11px] truncate block leading-tight">
                        {currentUser?.name || "Participant"}
                      </span>
                      <span className="text-[9px] text-zinc-500 truncate block mt-0.5">
                        {currentUser?.roll_no || "Student Pass"}
                      </span>
                    </div>

                    <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 uppercase font-mono block">Status</span>
                      <div className="mt-0.5">
                        <span
                          className={`px-1.5 py-0.5 text-[8px] uppercase font-bold tracking-wider rounded inline-flex items-center gap-1 border ${
                            (activeTicketModal.attendance_status || "").toLowerCase() === "present"
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/40"
                              : "text-amber-400 bg-amber-500/10 border-amber-500/30"
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full ${(activeTicketModal.attendance_status || "").toLowerCase() === "present" ? "bg-emerald-400" : "bg-amber-400"}`} />
                          <span>{(activeTicketModal.attendance_status || "").toLowerCase() === "present" ? "Admitted" : "Valid Pass"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase font-mono block">Date</span>
                      <span className="text-zinc-200 font-semibold block truncate">
                        {activeTicketModal.start_date || "TBA"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase font-mono block">Venue</span>
                      <span className="text-zinc-200 font-semibold truncate block">
                        {activeTicketModal.venue || "Campus Venue"}
                      </span>
                    </div>
                  </div>

                  {currentUser?.college && (
                    <div className="pt-1.5 border-t border-zinc-900/80">
                      <span className="text-[8px] text-zinc-500 uppercase font-mono block">College</span>
                      <span className="text-zinc-400 text-[10px] truncate block">
                        {currentUser.college}
                      </span>
                    </div>
                  )}

                  {/* Barcode Strip Graphic Effect at Ticket Footer */}
                  <div className="pt-1.5">
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

              {/* FIXED FOOTER BUTTON */}
              <div className="p-3 bg-zinc-950 border-t border-zinc-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTicketModal(null)}
                  className="w-full py-2 bg-white hover:bg-zinc-200 text-black uppercase text-[11px] font-bold rounded-lg transition-all shadow-md"
                >
                  Close Pass
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: COMPREHENSIVE USER PROFILE & ENGAGEMENT DETAILS   */}
      {/* ======================================================== */}
      {(viewingUserDetails || loadingUserDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {loadingUserDetails && !viewingUserDetails ? (
              <div className="py-20 text-center">
                <RefreshCw size={24} className="animate-spin mx-auto text-zinc-400 mb-3" />
                <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
                  Loading User Details...
                </p>
              </div>
            ) : viewingUserDetails?.user ? (
              <div>
                {/* Header Banner */}
                <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {viewingUserDetails.user.avatar ? (
                      <img
                        src={viewingUserDetails.user.avatar}
                        alt={viewingUserDetails.user.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-white/20 flex items-center justify-center text-xl font-black text-white shadow-lg">
                        {(viewingUserDetails.user.name || "U").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white tracking-tight">
                          {viewingUserDetails.user.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white border border-white/15">
                          {viewingUserDetails.user.role} · {viewingUserDetails.user.type}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                            viewingUserDetails.user.status === "blocked"
                              ? "border-rose-500/50 text-rose-400 bg-rose-500/10"
                              : "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                          }`}
                        >
                          {viewingUserDetails.user.status === "blocked" ? "Blocked" : "Active"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        {viewingUserDetails.user.email}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono mt-1">
                        {viewingUserDetails.user.created_at && (
                          <span>Joined: {viewingUserDetails.user.created_at}</span>
                        )}
                        <span>•</span>
                        <span className={viewingUserDetails.user.profile_completed ? "text-emerald-400 font-bold" : "text-amber-400"}>
                          {viewingUserDetails.user.profile_completed ? "Profile Completed" : "Profile Incomplete"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setViewingUserDetails(null)}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-white text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Engagement Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-800 border-b border-zinc-800 bg-zinc-900/40 text-center py-3.5">
                  <div>
                    <span className="text-xl font-black text-white block">
                      {viewingUserDetails.stats?.events_registered || 0}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                      Events Registered
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-emerald-400 block">
                      {viewingUserDetails.stats?.events_attended || 0}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                      Events Attended
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-white block">
                      {viewingUserDetails.stats?.orders_count || 0}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                      Swag / Orders
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-white block">
                      ₹{viewingUserDetails.stats?.total_spent || 0}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                      Total Spent
                    </span>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Section 1: Academic & Contact Profile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Academic Enrollment */}
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                        <GraduationCap size={15} className="text-white" />
                        <span>Academic Enrollment</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-500">Roll / Student ID</span>
                          <span className="font-mono font-bold text-white">
                            {viewingUserDetails.user.roll_no || "Not Provided"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-500">College</span>
                          <span className="text-right text-zinc-200">
                            {viewingUserDetails.user.college || "Not Provided"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-500">University</span>
                          <span className="text-right text-zinc-200">
                            {viewingUserDetails.user.university || "Autonomous"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-500">Course & Branch</span>
                          <span className="text-right text-zinc-200 font-semibold">
                            {[viewingUserDetails.user.course, viewingUserDetails.user.branch].filter(Boolean).join(" - ") || "Not Provided"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-zinc-500">Department & Sem</span>
                          <span className="text-right text-zinc-200">
                            {[viewingUserDetails.user.department, viewingUserDetails.user.semester].filter(Boolean).join(" · ") || "Not Provided"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Personal Info */}
                    <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                        <Building size={15} className="text-white" />
                        <span>Contact & Organization</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-500">Phone Number</span>
                          <span className="font-mono text-zinc-200">
                            {viewingUserDetails.user.phone || "Not Provided"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-500">Assigned Team Wing</span>
                          <span className="font-semibold text-white">
                            {viewingUserDetails.user.team || "None (General Attendee)"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-500">Designated Position</span>
                          <span className="text-zinc-200">
                            {viewingUserDetails.user.position || "Member"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-800/60">
                          <span className="text-zinc-500">Website Featured</span>
                          <span className={viewingUserDetails.user.show_on_website ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                            {viewingUserDetails.user.show_on_website ? `Yes (Order #${viewingUserDetails.user.website_order || 1})` : "Hidden"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-zinc-500">Social Links</span>
                          <div className="flex items-center gap-2">
                            {viewingUserDetails.user.github && (
                              <a href={viewingUserDetails.user.github} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white underline text-[11px]">
                                GitHub
                              </a>
                            )}
                            {viewingUserDetails.user.linkedin && (
                              <a href={viewingUserDetails.user.linkedin} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white underline text-[11px]">
                                LinkedIn
                              </a>
                            )}
                            {!viewingUserDetails.user.github && !viewingUserDetails.user.linkedin && (
                              <span className="text-zinc-600">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Event Registrations & Attendance */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                        <Ticket size={15} className="text-white" />
                        <span>Registered Events & Attendance Records</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {viewingUserDetails.registrations?.length || 0} Total Registrations
                      </span>
                    </div>

                    {(!viewingUserDetails.registrations || viewingUserDetails.registrations.length === 0) ? (
                      <div className="p-6 border border-zinc-800/80 bg-zinc-900/30 rounded-xl text-center text-zinc-500 text-xs font-mono">
                        This user has not registered for any events yet.
                      </div>
                    ) : (
                      <div className="border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase font-mono tracking-wider border-b border-zinc-800">
                            <tr>
                              <th className="p-3">Event Code & Title</th>
                              <th className="p-3">Date & Mode</th>
                              <th className="p-3">Token / Ticket</th>
                              <th className="p-3">Attendance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {viewingUserDetails.registrations.map((reg: any) => (
                              <tr key={reg.id} className="hover:bg-zinc-900/40">
                                <td className="p-3">
                                  <span className="font-bold text-white block">
                                    {reg.event?.title || "Event #" + reg.event_id}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-500 block">
                                    {reg.event?.code || "CZ-EV" + reg.event_id} · {reg.event?.venue || "Campus Hall"}
                                  </span>
                                </td>
                                <td className="p-3 text-zinc-300">
                                  <span>{reg.event?.start_date || "Scheduled"}</span>
                                  <span className="text-[10px] text-zinc-500 block uppercase">
                                    {reg.event?.mode || "Offline"}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-300">
                                  <span className="px-2 py-0.5 border border-zinc-800 bg-zinc-900 rounded">
                                    {reg.qr_token || `REG-${reg.id}-CZ`}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                      (reg.attendance_status || "").toLowerCase() === "present"
                                        ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                                        : "text-zinc-400 bg-zinc-800 border border-zinc-700"
                                    }`}
                                  >
                                    {(reg.attendance_status || "").toLowerCase() === "present" ? "Present" : "Absent"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Only Admin can block/unblock users */}
                    {isAdminOnly && (
                      <button
                        type="button"
                        onClick={() => toggleUserBlockStatus(viewingUserDetails.user)}
                        className={`px-3 py-2 text-xs font-bold uppercase rounded flex items-center gap-1.5 transition-colors border ${
                          viewingUserDetails.user.status === "blocked"
                            ? "bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/15 border-rose-500/40 hover:bg-rose-500/25 text-rose-400"
                        }`}
                      >
                        {viewingUserDetails.user.status === "blocked" ? (
                          <>
                            <CheckCircle size={14} />
                            <span>Unblock User</span>
                          </>
                        ) : (
                          <>
                            <Ban size={14} />
                            <span>Block User</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Lead quick promote from details modal */}
                    {!isAdminOnly && isTeamLead && viewingUserDetails.user.role === "User" && (
                      <button
                        type="button"
                        onClick={() => {
                          const u = viewingUserDetails.user;
                          setViewingUserDetails(null);
                          handleLeadDirectPromote(u);
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-xs rounded transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck size={13} />
                        <span>Promote to {currentUser?.team || "Team"} Member</span>
                      </button>
                    )}

                    {/* Admin edit/modify full hierarchy */}
                    {isAdminOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const u = viewingUserDetails.user;
                          setViewingUserDetails(null);
                          setEditingUser(u);
                        }}
                        className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold uppercase text-xs rounded transition-colors flex items-center gap-1.5"
                      >
                        <Edit size={13} />
                        <span>Edit / Modify User</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewingUserDetails(null)}
                      className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold rounded transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
