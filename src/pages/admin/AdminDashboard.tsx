import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Home,
  Calendar as CalendarIcon,
  ShoppingBag,
  Trash2,
  Edit,
  Save,
  Activity,
  FileText,
  Download,
  Check,
  X,
  Lock,
  Unlock,
  PlusCircle,
  Search,
  Users,
  FolderOpen
} from "lucide-react";
import { toast, Toaster } from "sonner";

// --- TYPES ---
interface Milestone {
  id: string;
  year: string;
  title: string;
  description: string;
}

interface EasterEgg {
  id: string;
  name: string;
  trigger: string;
  description: string;
  isActive: boolean;
}

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  category: string;
}

interface CodeZenEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  category: "upcoming" | "past";
  maxCapacity: number;
  isRegistrationOpen: boolean;
  registeredCount: number;
}

interface Registration {
  id: string;
  name: string;
  email: string;
  rollNo: string;
  branch: string;
  eventTitle: string;
  status: "Approved" | "Pending" | "Rejected";
  date: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  isActive: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  domain: string;
  tags: string[];
}

interface ExpertiseTag {
  name: string;
  color: string; // e.g. "sky", "emerald", "pink", "amber", "purple"
}

interface RolePermission {
  role: string;
  permissions: {
    manageEvents: boolean;
    manageUsers: boolean;
    manageStore: boolean;
    updateSettings: boolean;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "home" | "events" | "calendar" | "showcase" | "store" | "team"
  >("overview");

  // --- MOCK DATABASE STATE ---
  
  // 1. Home Section Mock State
  const [heroTitle, setHeroTitle] = useState("Explore CODEZEN");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "CGC University's largest student-led technology community empowering students through innovation, collaboration, and real-world learning."
  );
  const [heroCtaText, setHeroCtaText] = useState("Get in touch");
  const [availabilityPingSpeed, setAvailabilityPingSpeed] = useState("slow"); // slow, normal, fast
  const [isAvailabilityBadgeVisible, setIsAvailabilityBadgeVisible] = useState(true);

  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "1", year: "2024", title: "Club Founded", description: "Launched CodeZen with 20 core technical members." },
    { id: "2", year: "2025", title: "Hackathon Genesis", description: "Hosted CGC's largest 24-hour hackathon with 400+ participants." },
    { id: "3", year: "2026", title: "Ecosystem Launch", description: "Released CodeZen Hub & community portal." }
  ]);
  const [newMilestone, setNewMilestone] = useState<Omit<Milestone, "id">>({ year: "", title: "", description: "" });
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  const [easterEggs, setEasterEggs] = useState<EasterEgg[]>([
    { id: "e1", name: "Matrix Rain Code", trigger: "matrix", description: "Triggers a full-screen green code rain effect.", isActive: true },
    { id: "e2", name: "Konami Code Spin", trigger: "up-up-down-down", description: "Rotates the entire home page container by 360 degrees.", isActive: false },
    { id: "e3", name: "Glitch Title", trigger: "glitch", description: "Applies a temporary RGB split effect to the brand logo.", isActive: true }
  ]);

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([
    { id: "g1", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600", caption: "CodeZen Hackathon 2025 Team", category: "Hackathon" },
    { id: "g2", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600", caption: "UI/UX Workshop Session", category: "Workshop" },
    { id: "g3", url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600", caption: "Community Meetup #4", category: "Meetup" }
  ]);
  const [newGalleryImg, setNewGalleryImg] = useState({ url: "", caption: "", category: "Workshop" });

  // 2. Events Mock State
  const [events, setEvents] = useState<CodeZenEvent[]>([
    { id: "ev1", title: "CodeZen DevFest 2026", date: "2026-07-15", time: "10:00 AM", venue: "Auditorium 1", category: "upcoming", maxCapacity: 200, isRegistrationOpen: true, registeredCount: 142 },
    { id: "ev2", title: "Figma UI/UX Jam", date: "2026-08-05", time: "02:00 PM", venue: "Lab 3", category: "upcoming", maxCapacity: 50, isRegistrationOpen: true, registeredCount: 22 },
    { id: "ev3", title: "Web3 Mastery Panel", date: "2026-05-20", time: "11:00 AM", venue: "Seminar Hall", category: "past", maxCapacity: 150, isRegistrationOpen: false, registeredCount: 150 },
    { id: "ev4", title: "CGC Hack 2025", date: "2025-10-12", time: "09:00 AM", venue: "Main Campus", category: "past", maxCapacity: 400, isRegistrationOpen: false, registeredCount: 388 }
  ]);
  const [newEvent, setNewEvent] = useState<Omit<CodeZenEvent, "id" | "registeredCount">>({
    title: "",
    date: "",
    time: "",
    venue: "",
    category: "upcoming",
    maxCapacity: 100,
    isRegistrationOpen: true
  });

  const [registrations, setRegistrations] = useState<Registration[]>([
    { id: "r1", name: "Devinder Singh", email: "devinder@cgc.edu", rollNo: "2210981045", branch: "CSE", eventTitle: "CodeZen DevFest 2026", status: "Approved", date: "2026-06-25" },
    { id: "r2", name: "Aarav Sharma", email: "aarav.sharma@cgc.edu", rollNo: "2210982003", branch: "ECE", eventTitle: "CodeZen DevFest 2026", status: "Pending", date: "2026-06-27" },
    { id: "r3", name: "Priya Patel", email: "priya.p@cgc.edu", rollNo: "2310994012", branch: "IT", eventTitle: "Figma UI/UX Jam", status: "Approved", date: "2026-06-28" },
    { id: "r4", name: "Kabir Verma", email: "kabir.v@cgc.edu", rollNo: "2210981102", branch: "CSE", eventTitle: "CodeZen DevFest 2026", status: "Rejected", date: "2026-06-24" }
  ]);
  const [regSearch, setRegSearch] = useState("");
  const [regFilterEvent, setRegFilterEvent] = useState("all");

  // 3. Calendar Mock State
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("2026-07-15");
  const [calendarEvents, setCalendarEvents] = useState<Record<string, string[]>>({
    "2026-07-15": ["CodeZen DevFest 2026"],
    "2026-08-05": ["Figma UI/UX Jam"]
  });
  const [newCalendarEventTitle, setNewCalendarEventTitle] = useState("");

  // 4. Showcase Mock State
  const [isShowcaseHold, setIsShowcaseHold] = useState(true);

  // 5. Store Mock State
  const [products, setProducts] = useState<Product[]>([
    { id: "p1", name: "CodeZen Cyber Hoodie", price: 1299, stock: 45, category: "Apparel", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400", isActive: true },
    { id: "p2", name: "Tech Holographic Sticker Pack", price: 149, stock: 250, category: "Accessories", image: "https://images.unsplash.com/photo-1572375995501-4b0894dbe7d7?w=400", isActive: true },
    { id: "p3", name: "Metal Matte Bottle 750ml", price: 599, stock: 12, category: "Gear", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400", isActive: true }
  ]);
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    name: "", price: 0, stock: 10, category: "Apparel", image: "", isActive: true
  });
  const [storeOrders] = useState([
    { id: "ord-104", customer: "Harsh Arora", product: "CodeZen Cyber Hoodie", total: 1299, status: "Shipped", date: "2026-06-26" },
    { id: "ord-105", customer: "Sneha Goel", product: "Metal Matte Bottle 750ml", total: 599, status: "Processing", date: "2026-06-28" }
  ]);

  // 6. Team & RBAC Mock State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "t1", name: "Mayank Tiwari", role: "President & Founder", domain: "Technical", tags: ["Technical", "Management"] },
    { id: "t2", name: "Pranav Gupta", role: "Tech Lead", domain: "Technical", tags: ["Technical"] },
    { id: "t3", name: "Diya Roy", role: "UI/UX Lead", domain: "Design", tags: ["Graphics"] },
    { id: "t4", name: "Tushar Singla", role: "Operations Lead", domain: "Management", tags: ["Management"] },
    { id: "t5", name: "Ahana Sen", role: "Media Head", domain: "Marketing", tags: ["Video Creator", "Content Creator"] }
  ]);
  
  const [expertiseTags, setExpertiseTags] = useState<ExpertiseTag[]>([
    { name: "Technical", color: "sky" },
    { name: "Management", color: "emerald" },
    { name: "Video Creator", color: "purple" },
    { name: "Content Creator", color: "amber" },
    { name: "Graphics", color: "pink" }
  ]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("sky");

  const [newTeamMember, setNewTeamMember] = useState<Omit<TeamMember, "id">>({
    name: "", role: "", domain: "Technical", tags: []
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([
    { role: "Super Admin", permissions: { manageEvents: true, manageUsers: true, manageStore: true, updateSettings: true } },
    { role: "Event Editor", permissions: { manageEvents: true, manageUsers: false, manageStore: false, updateSettings: false } },
    { role: "Store Moderator", permissions: { manageEvents: false, manageUsers: false, manageStore: true, updateSettings: false } }
  ]);

  // --- HELPER HANDLERS ---
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.year || !newMilestone.title) {
      toast.error("Please fill in year and title");
      return;
    }
    const created: Milestone = {
      id: Math.random().toString(),
      ...newMilestone
    };
    setMilestones([...milestones, created]);
    setNewMilestone({ year: "", title: "", description: "" });
    toast.success("Milestone added successfully!");
  };

  const handleUpdateMilestone = (id: string, updated: Milestone) => {
    setMilestones(milestones.map(m => m.id === id ? updated : m));
    setEditingMilestoneId(null);
    toast.success("Milestone updated!");
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
    toast.error("Milestone deleted.");
  };

  const handleAddGalleryImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryImg.url) {
      toast.error("Please provide an image URL");
      return;
    }
    const img: GalleryImage = {
      id: Math.random().toString(),
      ...newGalleryImg
    };
    setGalleryImages([...galleryImages, img]);
    setNewGalleryImg({ url: "", caption: "", category: "Workshop" });
    toast.success("Gallery photo uploaded successfully!");
  };

  const handleDeleteGalleryImage = (id: string) => {
    setGalleryImages(galleryImages.filter(g => g.id !== id));
    toast.error("Gallery photo removed.");
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.venue) {
      toast.error("Please fill event title, date and venue");
      return;
    }
    const created: CodeZenEvent = {
      id: Math.random().toString(),
      ...newEvent,
      registeredCount: 0
    };
    setEvents([...events, created]);
    
    // Auto-update calendar dates with event
    setCalendarEvents({
      ...calendarEvents,
      [newEvent.date]: [...(calendarEvents[newEvent.date] || []), newEvent.title]
    });

    setNewEvent({
      title: "",
      date: "",
      time: "",
      venue: "",
      category: "upcoming",
      maxCapacity: 100,
      isRegistrationOpen: true
    });
    toast.success("New Event successfully scheduled!");
  };

  const handleToggleRegistration = (id: string) => {
    setEvents(events.map(ev => ev.id === id ? { ...ev, isRegistrationOpen: !ev.isRegistrationOpen } : ev));
    toast.success("Registration status updated!");
  };

  const handleDeleteEvent = (id: string) => {
    const ev = events.find(e => e.id === id);
    setEvents(events.filter(e => e.id !== id));
    if (ev && calendarEvents[ev.date]) {
      setCalendarEvents({
        ...calendarEvents,
        [ev.date]: calendarEvents[ev.date].filter(title => title !== ev.title)
      });
    }
    toast.error("Event deleted.");
  };

  const handleUpdateRegStatus = (id: string, status: "Approved" | "Pending" | "Rejected") => {
    setRegistrations(registrations.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Registration marked as ${status}`);
  };

  const handleExportCSV = () => {
    const headers = "ID,Name,Email,RollNo,Branch,Event,Status,Date\n";
    const rows = registrations
      .map(r => `${r.id},${r.name},${r.email},${r.rollNo},${r.branch},${r.eventTitle},${r.status},${r.date}`)
      .join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CodeZen_Registrations_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    toast.success("CSV file downloaded successfully!");
  };

  const handleAddCalendarEvent = () => {
    if (!newCalendarEventTitle.trim()) return;
    setCalendarEvents({
      ...calendarEvents,
      [selectedCalendarDate]: [...(calendarEvents[selectedCalendarDate] || []), newCalendarEventTitle]
    });
    setNewCalendarEventTitle("");
    toast.success("Event scheduled on Calendar!");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error("Please enter a valid product name and price");
      return;
    }
    const created: Product = {
      id: Math.random().toString(),
      ...newProduct
    };
    setProducts([...products, created]);
    setNewProduct({ name: "", price: 0, stock: 10, category: "Apparel", image: "", isActive: true });
    toast.success("Merch product added to store inventory!");
  };

  const handleToggleProductStatus = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
    toast.success("Product status toggled");
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.error("Product deleted.");
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    if (expertiseTags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast.error("Tag already exists");
      return;
    }
    setExpertiseTags([...expertiseTags, { name: newTagName.trim(), color: newTagColor }]);
    setNewTagName("");
    toast.success(`Dynamic Tag "${newTagName}" created!`);
  };

  const handleDeleteTag = (name: string) => {
    setExpertiseTags(expertiseTags.filter(t => t.name !== name));
    // Remove from team members too
    setTeamMembers(teamMembers.map(tm => ({
      ...tm,
      tags: tm.tags.filter(t => t !== name)
    })));
    toast.error(`Expertise Tag "${name}" deleted.`);
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamMember.name || !newTeamMember.role) {
      toast.error("Please enter member name and role");
      return;
    }
    const created: TeamMember = {
      id: Math.random().toString(),
      ...newTeamMember
    };
    setTeamMembers([...teamMembers, created]);
    setNewTeamMember({ name: "", role: "", domain: "Technical", tags: [] });
    toast.success("Core Team member added!");
  };

  const handleToggleMemberTag = (memberId: string, tagName: string) => {
    setTeamMembers(teamMembers.map(tm => {
      if (tm.id !== memberId) return tm;
      const hasTag = tm.tags.includes(tagName);
      return {
        ...tm,
        tags: hasTag ? tm.tags.filter(t => t !== tagName) : [...tm.tags, tagName]
      };
    }));
  };

  const handleDeleteTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(t => t.id !== id));
    toast.error("Team member removed.");
  };

  const handlePermissionToggle = (roleIndex: number, field: keyof RolePermission["permissions"]) => {
    const updated = [...rolePermissions];
    updated[roleIndex].permissions[field] = !updated[roleIndex].permissions[field];
    setRolePermissions(updated);
    toast.success("Role permissions updated!");
  };

  // --- FILTERS & SEARCHES ---
  const filteredRegs = registrations.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.rollNo.includes(regSearch);
    const matchesEvent = regFilterEvent === "all" || r.eventTitle === regFilterEvent;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="h-screen overflow-hidden bg-black text-white font-sans flex flex-col md:flex-row relative">
      <style>{`
        /* Hide scrollbars for all overflow containers inside the admin dashboard */
        .overflow-y-auto, .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .overflow-y-auto::-webkit-scrollbar, .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
      <Toaster position="top-right" theme="dark" closeButton />
      
      {/* Brand logo custom styling, absolutely positioned for consistency with main layout */}
      <div className="absolute top-4 right-4 z-50 pointer-events-none hidden md:block">
        <span className="font-mono text-[9px] tracking-widest text-white/30 uppercase bg-white/5 border border-white/10 px-2.5 py-1">
          Admin Portal • v1.0.4-Static
        </span>
      </div>

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-zinc-950 flex flex-col justify-between p-6 shrink-0">
        <div>
          {/* Logo */}
          <div className="mb-8 mt-2 flex items-center justify-between">
            <Link to="/" className="group">
              <h1 className="font-black text-2xl tracking-tighter text-white flex items-start">
                CODEZEN
                <span className="text-[10px] font-medium ml-1 -mt-1 font-mono text-white/40">admin</span>
              </h1>
            </Link>
          </div>

          {/* Quick status bar */}
          <div className="p-3 bg-white/5 border border-white/10 mb-6 flex flex-col gap-1.5 rounded-sm">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                System Synchronized
              </span>
            </div>
            <p className="text-[9px] font-mono text-zinc-500">Local DB Session Active</p>
          </div>

          {/* Nav List */}
          <nav className="flex flex-col gap-1">
            {[
              { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
              { id: "home", label: "Home Manager", icon: Home },
              { id: "events", label: "Events & Registrations", icon: FileText },
              { id: "calendar", label: "Calendar Scheduler", icon: CalendarIcon },
              { id: "showcase", label: "Showcase (Hold)", icon: FolderOpen },
              { id: "store", label: "Store Manager", icon: ShoppingBag },
              { id: "team", label: "Team & RBAC", icon: Users }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-left border transition-all ${
                    isActive
                      ? "bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                      : "bg-transparent text-zinc-400 border-transparent hover:border-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col gap-2">
          <Link
            to="/"
            className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
          >
            ← View Public Site
          </Link>
          <p className="text-[9px] font-mono text-zinc-600">© 2026 CodeZen Ecosystem</p>
        </div>
      </aside>

      {/* --- MAIN CONTENT PANELS --- */}
      <main className="flex-1 bg-black p-6 md:p-10 overflow-y-auto h-full" data-lenis-prevent>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-8"
          >
            
            {/* ========================================================================= */}
            {/* OVERVIEW PANEL */}
            {/* ========================================================================= */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Dashboard Overview</h2>
                  <p className="text-zinc-400 text-sm mt-1">Real-time indicators and ecosystem vitals.</p>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Active Registrations", value: registrations.length, color: "text-sky-400", bg: "bg-sky-400/5", sub: "+3 pending approval" },
                    { label: "Scheduled Events", value: events.filter(e => e.category === "upcoming").length, color: "text-emerald-400", bg: "bg-emerald-400/5", sub: "Next Event: DevFest" },
                    { label: "Total Merch Sales", value: `₹${storeOrders.reduce((sum, o) => sum + o.total, 0)}`, color: "text-pink-400", bg: "bg-pink-400/5", sub: "2 pending delivery" },
                    { label: "Core Members", value: teamMembers.length, color: "text-amber-400", bg: "bg-amber-400/5", sub: "Across 4 main domains" }
                  ].map(stat => (
                    <div key={stat.label} className="p-5 border border-white/10 bg-zinc-950/40 relative overflow-hidden group">
                      <div className={`absolute top-0 left-0 w-1 h-full ${stat.color.replace("text-", "bg-")}`} />
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                      <h3 className={`text-4xl font-black mt-2 ${stat.color}`}>{stat.value}</h3>
                      <p className="text-[10px] font-mono text-zinc-400 mt-2 flex items-center gap-1">
                        <Activity size={10} className="animate-pulse" /> {stat.sub}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Subgrid: Server Uptime Graph & Activity logs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Performance / Network Card */}
                  <div className="lg:col-span-2 border border-white/10 bg-zinc-950 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400" /> Database Performance (API Request Response)
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 uppercase">Stable</span>
                    </div>
                    {/* Simulated SVG Graph */}
                    <div className="h-44 w-full bg-zinc-900/30 border border-white/5 relative flex items-end p-2 overflow-hidden">
                      <svg className="w-full h-32 text-emerald-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                          d="M0,80 L10,65 L20,75 L30,45 L40,55 L50,30 L60,40 L70,15 L80,25 L90,8 L100,5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M0,80 L10,65 L20,75 L30,45 L40,55 L50,30 L60,40 L70,15 L80,25 L90,8 L100,5 L100,100 L0,100 Z"
                          fill="currentColor"
                          opacity="0.05"
                        />
                      </svg>
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                        <div className="w-full h-px bg-white" />
                        <div className="w-full h-px bg-white" />
                        <div className="w-full h-px bg-white" />
                        <div className="w-full h-px bg-white" />
                      </div>
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono text-zinc-500">21:00</span>
                      <span className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-500">Active Session</span>
                    </div>
                  </div>

                  {/* Recent Logs panel */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-2">
                      <FileText size={14} /> System Access Log
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {[
                        { time: "21:30:18", event: "Admin dashboard loaded", type: "system" },
                        { time: "21:28:44", event: "Member data synchronized", type: "sync" },
                        { time: "21:20:12", event: "New registration approved: Devinder Singh", type: "action" },
                        { time: "20:44:09", event: "Store item stock level updated", type: "store" }
                      ].map((log, idx) => (
                        <div key={idx} className="text-[10px] font-mono border-b border-white/5 pb-2 last:border-b-0 flex gap-2 items-start">
                          <span className="text-zinc-600">{log.time}</span>
                          <div>
                            <p className="text-zinc-300">{log.event}</p>
                            <span className={`text-[8px] uppercase px-1 py-0.2 border ${
                              log.type === "system" ? "border-sky-500/25 text-sky-400" :
                              log.type === "sync" ? "border-emerald-500/25 text-emerald-400" : "border-pink-500/25 text-pink-400"
                            }`}>{log.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* HOME MANAGER PANEL */}
            {/* ========================================================================= */}
            {activeTab === "home" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Home Manager</h2>
                  <p className="text-zinc-400 text-sm mt-1">Configure layout, milestones, interactive components, and easter eggs.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Hero Settings */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-sky-400 border-b border-white/5 pb-2">Hero Section Content</h3>
                    
                    <div className="space-y-4 text-xs font-mono">
                      <div className="space-y-2">
                        <label className="text-zinc-400">Headline Title</label>
                        <input
                          type="text"
                          value={heroTitle}
                          onChange={e => setHeroTitle(e.target.value)}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-zinc-400">Subtitle Description</label>
                        <textarea
                          rows={4}
                          value={heroSubtitle}
                          onChange={e => setHeroSubtitle(e.target.value)}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-zinc-400">CTA Button Label</label>
                          <input
                            type="text"
                            value={heroCtaText}
                            onChange={e => setHeroCtaText(e.target.value)}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-zinc-400">Availability Ping Rate</label>
                          <select
                            value={availabilityPingSpeed}
                            onChange={e => setAvailabilityPingSpeed(e.target.value)}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          >
                            <option value="slow">Slow Pulse</option>
                            <option value="normal">Normal Pulse</option>
                            <option value="fast">Rapid Ping</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="checkbox"
                          id="avail-toggle"
                          checked={isAvailabilityBadgeVisible}
                          onChange={e => setIsAvailabilityBadgeVisible(e.target.checked)}
                          className="h-4 w-4 bg-black border border-white/15 text-white accent-white"
                        />
                        <label htmlFor="avail-toggle" className="text-zinc-300 select-none">
                          Show Status Badge ("Build • Develop • Grow")
                        </label>
                      </div>

                      <button
                        onClick={() => toast.success("Hero settings stored in local configuration!")}
                        className="w-full bg-white text-black py-2.5 font-black uppercase tracking-widest text-center text-[10px] mt-4 flex items-center justify-center gap-2"
                      >
                        <Save size={12} /> Save Layout Config
                      </button>
                    </div>
                  </div>

                  {/* Easter Eggs manager */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-pink-400 border-b border-white/5 pb-2">Active Easter Eggs</h3>
                    <div className="space-y-4">
                      {easterEggs.map(egg => (
                        <div key={egg.id} className="p-4 border border-white/5 bg-black/40 flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-wide text-zinc-100 flex items-center gap-1.5">
                              {egg.name}
                              <span className="text-[9px] font-mono bg-white/5 border border-white/10 text-white/50 px-1.5 py-0.2">
                                key: "{egg.trigger}"
                              </span>
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-mono">{egg.description}</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setEasterEggs(easterEggs.map(e => e.id === egg.id ? { ...e, isActive: !e.isActive } : e));
                              toast.info(`Easter Egg "${egg.name}" toggled ${!egg.isActive ? 'ON' : 'OFF'}`);
                            }}
                            className={`px-3 py-1 font-mono text-[9px] font-black uppercase border transition-all ${
                              egg.isActive
                                ? "bg-pink-500/10 text-pink-400 border-pink-500/40"
                                : "bg-transparent text-zinc-500 border-white/10"
                            }`}
                          >
                            {egg.isActive ? "Active" : "Disabled"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Milestones and Gallery Block */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Milestones Editor */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-sm font-mono uppercase tracking-widest text-emerald-400">Milestones Config</h3>
                      <span className="text-[10px] font-mono text-zinc-500">{milestones.length} Active Milestones</span>
                    </div>

                    {/* Active Milestones List */}
                    <div className="space-y-3">
                      {milestones.map(m => (
                        <div key={m.id} className="p-3 border border-white/5 bg-black/40 flex justify-between items-start">
                          {editingMilestoneId === m.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleUpdateMilestone(m.id, {
                                  id: m.id,
                                  year: formData.get("year") as string,
                                  title: formData.get("title") as string,
                                  description: formData.get("description") as string
                                });
                              }}
                              className="w-full grid grid-cols-1 gap-2 text-xs font-mono"
                            >
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  name="year"
                                  defaultValue={m.year}
                                  className="w-16 bg-black border border-white/15 px-2 py-1 text-white"
                                />
                                <input
                                  type="text"
                                  name="title"
                                  defaultValue={m.title}
                                  className="flex-1 bg-black border border-white/15 px-2 py-1 text-white"
                                />
                              </div>
                              <textarea
                                name="description"
                                defaultValue={m.description}
                                rows={2}
                                className="w-full bg-black border border-white/15 px-2 py-1 text-white"
                              />
                              <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setEditingMilestoneId(null)} className="px-2.5 py-1 text-[9px] uppercase border border-white/10 text-zinc-400 hover:text-white">Cancel</button>
                                <button type="submit" className="px-2.5 py-1 text-[9px] uppercase bg-white text-black font-bold">Apply</button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div>
                                <span className="text-xs font-mono font-black text-emerald-400">{m.year}</span>
                                <h4 className="text-xs font-black uppercase text-zinc-100 mt-0.5">{m.title}</h4>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1">{m.description}</p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditingMilestoneId(m.id)}
                                  className="p-1 hover:bg-white/5 border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-colors"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMilestone(m.id)}
                                  className="p-1 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Milestone Form */}
                    <form onSubmit={handleAddMilestone} className="border-t border-white/5 pt-4 space-y-3 text-xs font-mono">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Add New Milestone</p>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Year (e.g. 2026)"
                          value={newMilestone.year}
                          onChange={e => setNewMilestone({ ...newMilestone, year: e.target.value })}
                          className="col-span-1 bg-black border border-white/15 px-2 py-1.5 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Milestone Title"
                          value={newMilestone.title}
                          onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                          className="col-span-2 bg-black border border-white/15 px-2 py-1.5 text-white"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Description of milestone achievement"
                        value={newMilestone.description}
                        onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                        className="w-full bg-black border border-white/15 px-2 py-1.5 text-white"
                      />
                      <button
                        type="submit"
                        className="w-full bg-white/5 border border-white/10 hover:border-white text-white py-2 font-black uppercase text-[10px] flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle size={12} /> Create Milestone
                      </button>
                    </form>
                  </div>

                  {/* Gallery Manager */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-sm font-mono uppercase tracking-widest text-amber-400">Gallery Media</h3>
                      <span className="text-[10px] font-mono text-zinc-500">{galleryImages.length} Photos</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
                      {galleryImages.map(img => (
                        <div key={img.id} className="relative group aspect-square bg-zinc-900 border border-white/5 overflow-hidden">
                          <img src={img.url} alt={img.caption} className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-1.5 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/35 px-1 py-0.2 rounded-sm w-fit font-mono">{img.category}</span>
                            <div className="flex justify-between items-center mt-auto">
                              <p className="text-[8px] font-mono text-zinc-200 truncate flex-1 pr-1">{img.caption}</p>
                              <button onClick={() => handleDeleteGalleryImage(img.id)} className="p-0.5 bg-rose-500 text-white rounded-sm hover:bg-rose-600">
                                <Trash2 size={9} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Image URL */}
                    <form onSubmit={handleAddGalleryImage} className="border-t border-white/5 pt-4 space-y-3 text-xs font-mono">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Add Gallery Image</p>
                      <input
                        type="url"
                        placeholder="Image URL (Unsplash, etc.)"
                        value={newGalleryImg.url}
                        onChange={e => setNewGalleryImg({ ...newGalleryImg, url: e.target.value })}
                        className="w-full bg-black border border-white/15 px-2 py-1.5 text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Image Caption"
                          value={newGalleryImg.caption}
                          onChange={e => setNewGalleryImg({ ...newGalleryImg, caption: e.target.value })}
                          className="bg-black border border-white/15 px-2 py-1.5 text-white"
                        />
                        <select
                          value={newGalleryImg.category}
                          onChange={e => setNewGalleryImg({ ...newGalleryImg, category: e.target.value })}
                          className="bg-black border border-white/15 px-2 py-1.5 text-white"
                        >
                          <option value="Workshop">Workshop</option>
                          <option value="Hackathon">Hackathon</option>
                          <option value="Meetup">Meetup</option>
                          <option value="Cultural">Cultural</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-white/5 border border-white/10 hover:border-white text-white py-2 font-black uppercase text-[10px] flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle size={12} /> Add Photo
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* EVENTS PANEL */}
            {/* ========================================================================= */}
            {activeTab === "events" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Events & Registration</h2>
                  <p className="text-zinc-400 text-sm mt-1">Manage scheduled events, event registries, past archives, and applicant lists.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Event Creator Form */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-sky-400 border-b border-white/5 pb-2">Schedule New Event</h3>
                    
                    <form onSubmit={handleAddEvent} className="space-y-4 text-xs font-mono">
                      <div className="space-y-1">
                        <label className="text-zinc-400">Event Title</label>
                        <input
                          type="text"
                          required
                          value={newEvent.title}
                          onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          placeholder="e.g. CodeZen Hackathon 2.0"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-zinc-400">Date</label>
                          <input
                            type="date"
                            required
                            value={newEvent.date}
                            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-zinc-400">Time</label>
                          <input
                            type="text"
                            required
                            value={newEvent.time}
                            onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                            placeholder="e.g. 10:00 AM"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-400">Venue</label>
                        <input
                          type="text"
                          required
                          value={newEvent.venue}
                          onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          placeholder="e.g. Seminar Hall, Block C"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-zinc-400">Category</label>
                          <select
                            value={newEvent.category}
                            onChange={e => setNewEvent({ ...newEvent, category: e.target.value as any })}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="past">Past (Archive)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-zinc-400">Seat Capacity</label>
                          <input
                            type="number"
                            value={newEvent.maxCapacity}
                            onChange={e => setNewEvent({ ...newEvent, maxCapacity: parseInt(e.target.value) || 50 })}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 pt-2">
                        <input
                          type="checkbox"
                          id="isRegOpen"
                          checked={newEvent.isRegistrationOpen}
                          onChange={e => setNewEvent({ ...newEvent, isRegistrationOpen: e.target.checked })}
                          className="h-4 w-4 bg-black border border-white/15 text-white accent-white"
                        />
                        <label htmlFor="isRegOpen" className="text-zinc-300 select-none">Open Registration immediately</label>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-white text-black py-2.5 font-black uppercase tracking-widest text-center text-[10px] mt-4 flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle size={12} /> Schedule & Publish
                      </button>
                    </form>
                  </div>

                  {/* Scheduled Events Grid List */}
                  <div className="lg:col-span-2 border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-100 border-b border-white/5 pb-2">Active Scheduled Events</h3>
                    
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                      {events.map(ev => (
                        <div key={ev.id} className="p-4 border border-white/5 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 border ${
                                ev.category === "upcoming" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-zinc-500/30 text-zinc-400 bg-zinc-500/5"
                              }`}>{ev.category}</span>
                              <span className="text-[10px] font-mono text-zinc-500">{ev.date} @ {ev.time}</span>
                            </div>
                            <h4 className="text-sm font-black uppercase text-zinc-100">{ev.title}</h4>
                            <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                              <span>Venue: {ev.venue}</span>
                              <span>•</span>
                              <span>Seats: {ev.registeredCount} / {ev.maxCapacity}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {ev.category === "upcoming" && (
                              <button
                                onClick={() => handleToggleRegistration(ev.id)}
                                className={`px-2.5 py-1 text-[9px] font-mono font-black uppercase border transition-all ${
                                  ev.isRegistrationOpen
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                }`}
                              >
                                {ev.isRegistrationOpen ? "Reg: Open" : "Reg: Closed"}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-1.5 bg-zinc-900 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors rounded-sm"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Event Registrations Table */}
                <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-pink-400">Student Registrations List</h3>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1">Review student applications for active upcoming events.</p>
                    </div>
                    
                    {/* Filters & Export */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search applicants..."
                          value={regSearch}
                          onChange={e => setRegSearch(e.target.value)}
                          className="bg-black border border-white/10 px-8 py-1.5 text-xs text-white focus:border-white focus:outline-none w-44"
                        />
                      </div>

                      {/* Event Selector */}
                      <select
                        value={regFilterEvent}
                        onChange={e => setRegFilterEvent(e.target.value)}
                        className="bg-black border border-white/10 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="all">All Events</option>
                        {events.filter(e => e.category === "upcoming").map(e => (
                          <option key={e.id} value={e.title}>{e.title}</option>
                        ))}
                      </select>

                      {/* CSV Export */}
                      <button
                        onClick={handleExportCSV}
                        className="bg-white text-black text-xs font-black uppercase px-3 py-1.5 tracking-wider hover:opacity-85 transition-opacity flex items-center gap-1.5"
                      >
                        <Download size={13} /> Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Registrations Grid/Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-widest text-[10px]">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">Roll No & Branch</th>
                          <th className="py-3 px-4">Selected Event</th>
                          <th className="py-3 px-4">Date Registered</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRegs.length > 0 ? (
                          filteredRegs.map(reg => (
                            <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-bold text-zinc-100">{reg.name}</p>
                                <p className="text-[10px] text-zinc-500">{reg.email}</p>
                              </td>
                              <td className="py-3 px-4 text-zinc-300">
                                <span>{reg.rollNo}</span>
                                <span className="text-zinc-600 mx-1">|</span>
                                <span className="text-[10px] bg-white/5 px-1">{reg.branch}</span>
                              </td>
                              <td className="py-3 px-4 text-zinc-300 font-bold">{reg.eventTitle}</td>
                              <td className="py-3 px-4 text-zinc-500">{reg.date}</td>
                              <td className="py-3 px-4">
                                <div className="flex justify-center">
                                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 border ${
                                    reg.status === "Approved" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" :
                                    reg.status === "Rejected" ? "border-rose-500/30 text-rose-400 bg-rose-500/5" :
                                    "border-amber-500/30 text-amber-400 bg-amber-500/5"
                                  }`}>{reg.status}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleUpdateRegStatus(reg.id, "Approved")}
                                    className="p-1 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 text-zinc-400 hover:text-emerald-400 transition-colors"
                                    title="Approve Applicant"
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateRegStatus(reg.id, "Rejected")}
                                    className="p-1 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors"
                                    title="Reject Applicant"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-zinc-500 uppercase tracking-widest">
                              No registrations match current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* CALENDAR PANEL */}
            {/* ========================================================================= */}
            {activeTab === "calendar" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Calendar Scheduler</h2>
                  <p className="text-zinc-400 text-sm mt-1">Visually plan and view events scheduled in the current ecosystem.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Calendar Monthly Layout Grid */}
                  <div className="lg:col-span-2 border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-100">July 2026</h3>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 border border-white/10 uppercase">Static Scheduler View</span>
                      </div>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-bold uppercase text-zinc-500">
                      <div>Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                    </div>

                    {/* Month Days Grid (July 2026 starting on Wednesday) */}
                    <div className="grid grid-cols-7 gap-2 text-xs font-mono text-center">
                      {/* Blank days for previous month */}
                      <div className="p-3 bg-transparent text-zinc-800 pointer-events-none">28</div>
                      <div className="p-3 bg-transparent text-zinc-800 pointer-events-none">29</div>
                      <div className="p-3 bg-transparent text-zinc-800 pointer-events-none">30</div>
                      
                      {/* July Days */}
                      {Array.from({ length: 31 }, (_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `2026-07-${dayNum.toString().padStart(2, "0")}`;
                        const dayEvents = calendarEvents[dateStr] || [];
                        const isSelected = selectedCalendarDate === dateStr;
                        const hasEvents = dayEvents.length > 0;

                        return (
                          <button
                            key={dayNum}
                            onClick={() => setSelectedCalendarDate(dateStr)}
                            className={`p-3 relative aspect-square border transition-all ${
                              isSelected
                                ? "bg-white text-black border-white font-bold"
                                : "bg-black text-zinc-400 border-white/5 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            <span className="absolute top-1 left-1.5">{dayNum}</span>
                            {hasEvents && (
                              <span className={`absolute bottom-1 right-1.5 h-1.5 w-1.5 rounded-full ${
                                isSelected ? "bg-black" : "bg-sky-400 animate-pulse"
                              }`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day Detail & Scheduler Control Panel */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <div className="border-b border-white/5 pb-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Selected Date</h4>
                      <h3 className="text-lg font-black uppercase text-sky-400">{selectedCalendarDate}</h3>
                    </div>

                    {/* Selected Day's Events */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Scheduled Events</p>
                      
                      {(calendarEvents[selectedCalendarDate] || []).length > 0 ? (
                        (calendarEvents[selectedCalendarDate] || []).map((title, idx) => (
                          <div key={idx} className="p-3 border border-sky-500/20 bg-sky-500/5 text-xs font-mono flex items-center justify-between">
                            <span className="text-sky-300 font-bold">{title}</span>
                            <button
                              onClick={() => {
                                setCalendarEvents({
                                  ...calendarEvents,
                                  [selectedCalendarDate]: calendarEvents[selectedCalendarDate].filter(t => t !== title)
                                });
                                toast.info("Event removed from calendar view");
                              }}
                              className="text-zinc-500 hover:text-rose-400 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-500 font-mono italic">No events scheduled on this date.</p>
                      )}
                    </div>

                    {/* Schedule Input on Date */}
                    <div className="border-t border-white/5 pt-4 space-y-3 text-xs font-mono">
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Quick Add Event to Date</p>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Event Title"
                          value={newCalendarEventTitle}
                          onChange={e => setNewCalendarEventTitle(e.target.value)}
                          className="w-full bg-black border border-white/15 px-2 py-1.5 text-white"
                        />
                      </div>
                      
                      <button
                        onClick={handleAddCalendarEvent}
                        className="w-full bg-white text-black py-2 font-black uppercase text-[10px] flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle size={12} /> Add to Calendar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SHOWCASE PANEL */}
            {/* ========================================================================= */}
            {activeTab === "showcase" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Showcase Module</h2>
                  <p className="text-zinc-400 text-sm mt-1">Configure project submissions, gallery of works, and portfolio logs.</p>
                </div>

                {/* Showcase hold status screen */}
                <div className="border border-white/10 bg-zinc-950 p-6 md:p-10 relative overflow-hidden">
                  
                  {isShowcaseHold ? (
                    /* ON HOLD VIEW */
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
                        <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full flex items-center justify-center relative">
                          <Lock size={32} />
                        </div>
                      </div>
                      <div className="space-y-2 max-w-md">
                        <h3 className="text-lg font-black uppercase tracking-wide text-zinc-100">Showcase Modules Placed on Hold</h3>
                        <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                          This module is currently set to "HOLD" as per instructions from the core technical architects. Database mappings and project cards are currently suspended.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 w-full max-w-sm flex flex-col items-center gap-3">
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Superuser Bypass Controls</p>
                        <button
                          onClick={() => {
                            setIsShowcaseHold(false);
                            toast.info("Showcase module lock bypassed (Development view active)");
                          }}
                          className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 font-mono text-[10px] font-black uppercase hover:bg-amber-500 hover:text-black transition-all tracking-widest flex items-center gap-2"
                        >
                          <Unlock size={12} /> Force Bypass Hold Mode
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* BYPASSED / WORKING PREVIEW VIEW */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/5 border border-amber-400/10 px-2 py-0.5">
                            Bypass Hold Mode Active
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsShowcaseHold(true);
                            toast.success("Showcase module hold re-established.");
                          }}
                          className="text-[10px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
                        >
                          <Lock size={11} /> Re-lock Module
                        </button>
                      </div>

                      {/* Mock Project list */}
                      <div className="space-y-4">
                        <p className="text-xs font-mono text-zinc-400">Mock student portfolios (Preview layout structure):</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { title: "CodeZen Compiler API", student: "Pranav Gupta", stack: "Rust, WebAssembly", votes: 42 },
                            { title: "E-Commerce Blockchain App", student: "Aditya Vardhan", stack: "Solidity, Next.js", votes: 29 }
                          ].map((proj, idx) => (
                            <div key={idx} className="p-4 border border-white/5 bg-black/40 flex flex-col justify-between h-36">
                              <div>
                                <span className="text-[9px] font-mono text-zinc-500 uppercase">{proj.stack}</span>
                                <h4 className="text-sm font-black uppercase text-zinc-200 mt-1">{proj.title}</h4>
                                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Developed by {proj.student}</p>
                              </div>
                              <div className="flex justify-between items-center border-t border-white/5 pt-2">
                                <span className="text-[9px] font-mono text-zinc-400">Community Likes: {proj.votes}</span>
                                <button className="text-[9px] uppercase tracking-widest font-mono text-sky-400 hover:text-sky-300">View Project →</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STORE MANAGER PANEL */}
            {/* ========================================================================= */}
            {activeTab === "store" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Store Manager</h2>
                  <p className="text-zinc-400 text-sm mt-1">Manage CodeZen merchandise, check inventory stocks, and monitor orders.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add Merch Form */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6 text-xs font-mono">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-pink-400 border-b border-white/5 pb-2">Add Store Product</h3>
                    
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-zinc-400">Product Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CodeZen Metal Mug"
                          value={newProduct.name}
                          onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-zinc-400">Price (INR)</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 499"
                            value={newProduct.price || ""}
                            onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-zinc-400">Initial Stock</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 20"
                            value={newProduct.stock}
                            onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-zinc-400">Category</label>
                          <select
                            value={newProduct.category}
                            onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          >
                            <option value="Apparel">Apparel</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Gear">Gear</option>
                            <option value="Stickers">Stickers</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-zinc-400">Status</label>
                          <select
                            value={newProduct.isActive ? "true" : "false"}
                            onChange={e => setNewProduct({ ...newProduct, isActive: e.target.value === "true" })}
                            className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                          >
                            <option value="true">Active (Visible)</option>
                            <option value="false">Draft (Hidden)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-400">Image URL</label>
                        <input
                          type="url"
                          placeholder="https://unsplash.com/..."
                          value={newProduct.image}
                          onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-white text-black py-2.5 font-black uppercase tracking-widest text-center text-[10px] mt-4 flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle size={12} /> Create Product
                      </button>
                    </form>
                  </div>

                  {/* Merchandise Grid Inventory list */}
                  <div className="lg:col-span-2 border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-100 border-b border-white/5 pb-2">Active Merchandise Inventory</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                      {products.map(prod => (
                        <div key={prod.id} className="p-3 border border-white/5 bg-black/40 flex gap-3.5 items-center">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-16 h-16 object-cover border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-16 h-16 bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 font-mono text-[9px] uppercase tracking-wider shrink-0">No Image</div>
                          )}
                          
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <span className="text-[8px] font-mono uppercase text-zinc-500">{prod.category}</span>
                            <h4 className="text-xs font-black uppercase text-zinc-100 truncate">{prod.name}</h4>
                            <p className="text-[10px] font-mono text-zinc-400">
                              <span>Price: ₹{prod.price}</span>
                              <span className="mx-1 text-zinc-700">|</span>
                              <span className={prod.stock < 15 ? "text-amber-400 font-bold" : ""}>Stock: {prod.stock}</span>
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 items-end">
                            <button
                              onClick={() => handleToggleProductStatus(prod.id)}
                              className={`px-2 py-0.5 text-[8px] font-mono font-black uppercase border rounded-sm ${
                                prod.isActive ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" : "border-zinc-700 text-zinc-500"
                              }`}
                            >
                              {prod.isActive ? "Active" : "Draft"}
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="text-zinc-600 hover:text-rose-500 transition-colors p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Orders Log */}
                <div className="border border-white/10 bg-zinc-950 p-6 space-y-4">
                  <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-100 border-b border-white/5 pb-2">Recent Merchandise Orders</h3>
                  
                  <div className="space-y-3">
                    {storeOrders.map(order => (
                      <div key={order.id} className="p-3 border border-white/5 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 font-bold">{order.id}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-500">{order.date}</span>
                          </div>
                          <p className="text-zinc-100 font-bold uppercase">{order.product}</p>
                          <p className="text-[10px] text-zinc-500">Customer: {order.customer}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-zinc-100 font-black">₹{order.total}</span>
                          <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                            order.status === "Shipped" ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/5" : "border-amber-500/25 text-amber-400 bg-amber-500/5"
                          }`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TEAM & RBAC PANEL */}
            {/* ========================================================================= */}
            {activeTab === "team" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Team & Role Control</h2>
                  <p className="text-zinc-400 text-sm mt-1">Manage core team details, dynamic expertise labels, and Role-Based Access Control matrix.</p>
                </div>

                {/* Team member and tag creator */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Core Team Member Adder */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6 text-xs font-mono">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-sky-400 border-b border-white/5 pb-2">Add Core Team Member</h3>
                    
                    <form onSubmit={handleAddTeamMember} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-zinc-400">Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Diya Roy"
                          value={newTeamMember.name}
                          onChange={e => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-400">Role Designation</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. UI/UX Designer"
                          value={newTeamMember.role}
                          onChange={e => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-400">Domain Group</label>
                        <select
                          value={newTeamMember.domain}
                          onChange={e => setNewTeamMember({ ...newTeamMember, domain: e.target.value })}
                          className="w-full bg-black border border-white/15 px-3 py-2 text-white focus:border-white focus:outline-none"
                        >
                          <option value="Technical">Technical</option>
                          <option value="Design">Design</option>
                          <option value="Management">Management</option>
                          <option value="Marketing">Marketing</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-white text-black py-2.5 font-black uppercase tracking-widest text-center text-[10px] mt-4 flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle size={12} /> Add Team Member
                      </button>
                    </form>
                  </div>

                  {/* Core Team registry list */}
                  <div className="lg:col-span-2 border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-100 border-b border-white/5 pb-2">Ecosystem Team Registry</h3>
                    
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {teamMembers.map(tm => (
                        <div key={tm.id} className="p-3.5 border border-white/5 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <span className="text-[9px] font-mono bg-white/5 border border-white/10 text-white/50 px-1.5 py-0.2 uppercase">{tm.domain}</span>
                            <h4 className="text-sm font-black uppercase text-zinc-100 mt-1">{tm.name}</h4>
                            <p className="text-[10px] font-mono text-zinc-500">{tm.role}</p>
                            
                            {/* Tags list */}
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              {tm.tags.map(tag => {
                                const tagObj = expertiseTags.find(t => t.name === tag);
                                const tagColor = tagObj ? tagObj.color : "sky";
                                return (
                                  <span key={tag} className={`text-[8px] font-mono px-1.5 py-0.2 border uppercase ${
                                    tagColor === "sky" ? "border-sky-500/20 text-sky-400 bg-sky-500/5" :
                                    tagColor === "emerald" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                    tagColor === "pink" ? "border-pink-500/20 text-pink-400 bg-pink-500/5" :
                                    tagColor === "amber" ? "border-amber-500/20 text-amber-400 bg-amber-500/5" :
                                    "border-purple-500/20 text-purple-400 bg-purple-500/5"
                                  }`}>
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quick assign tag toggle options */}
                          <div className="flex items-center gap-3">
                            <div className="space-y-1 shrink-0">
                              <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider text-right">Assign Expertise</p>
                              <div className="flex gap-1">
                                {expertiseTags.map(tag => {
                                  const isAssigned = tm.tags.includes(tag.name);
                                  return (
                                    <button
                                      key={tag.name}
                                      onClick={() => handleToggleMemberTag(tm.id, tag.name)}
                                      title={`Toggle ${tag.name}`}
                                      className={`px-1.5 py-0.5 text-[8px] font-mono font-black uppercase border transition-all ${
                                        isAssigned
                                          ? "bg-white text-black border-white"
                                          : "bg-transparent text-zinc-500 border-white/5 hover:border-white/20"
                                      }`}
                                    >
                                      {tag.name.slice(0, 3)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteTeamMember(tm.id)}
                              className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-zinc-500 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dynamic Expertise Tag Management */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Dynamic Tag Settings */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-amber-400 border-b border-white/5 pb-2">Dynamic Expertise Tags Config</h3>
                    
                    <div className="space-y-4">
                      {/* Active Dynamic Tags list */}
                      <div className="flex flex-wrap gap-2">
                        {expertiseTags.map(tag => (
                          <div key={tag.name} className="flex items-center gap-1.5 border border-white/10 px-2.5 py-1.5 bg-black/40">
                            <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${
                              tag.color === "sky" ? "text-sky-400" :
                              tag.color === "emerald" ? "text-emerald-400" :
                              tag.color === "pink" ? "text-pink-400" :
                              tag.color === "amber" ? "text-amber-400" : "text-purple-400"
                            }`}>
                              {tag.name}
                            </span>
                            <button
                              onClick={() => handleDeleteTag(tag.name)}
                              className="text-zinc-500 hover:text-rose-500 transition-colors ml-1"
                              title="Delete tag"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Tag Form */}
                      <form onSubmit={handleAddTag} className="border-t border-white/5 pt-4 space-y-3 text-xs font-mono">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Create Dynamic Tag</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Tag name (e.g. Mentor)"
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            className="bg-black border border-white/15 px-2 py-1.5 text-white"
                          />
                          <select
                            value={newTagColor}
                            onChange={e => setNewTagColor(e.target.value)}
                            className="bg-black border border-white/15 px-2 py-1.5 text-white"
                          >
                            <option value="sky">Cyan Sky</option>
                            <option value="emerald">Green Emerald</option>
                            <option value="pink">Pink Accent</option>
                            <option value="amber">Amber Gold</option>
                            <option value="purple">Violet Purple</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-white/5 border border-white/10 hover:border-white text-white py-2 font-black uppercase text-[10px] flex items-center justify-center gap-1.5"
                        >
                          <PlusCircle size={12} /> Create Tag
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* RBAC Settings and Permissions Grid */}
                  <div className="border border-white/10 bg-zinc-950 p-6 space-y-6">
                    <h3 className="text-sm font-mono uppercase tracking-widest text-emerald-400 border-b border-white/5 pb-2">Role Permissions Matrix</h3>
                    
                    <div className="space-y-4">
                      {rolePermissions.map((rolePerm, roleIdx) => (
                        <div key={rolePerm.role} className="p-4 border border-white/5 bg-black/40 space-y-3 text-xs font-mono">
                          <h4 className="text-xs font-black uppercase text-zinc-100 tracking-wider">{rolePerm.role} Settings</h4>
                          
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                            {[
                              { label: "Manage Events", field: "manageEvents" },
                              { label: "Manage Users", field: "manageUsers" },
                              { label: "Manage Store", field: "manageStore" },
                              { label: "System Config", field: "updateSettings" }
                            ].map(perm => (
                              <label key={perm.field} className="flex items-center gap-2 select-none cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rolePerm.permissions[perm.field as keyof RolePermission["permissions"]]}
                                  onChange={() => handlePermissionToggle(roleIdx, perm.field as keyof RolePermission["permissions"])}
                                  className="h-3.5 w-3.5 bg-black border border-white/10 accent-white rounded-sm"
                                />
                                <span>{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
