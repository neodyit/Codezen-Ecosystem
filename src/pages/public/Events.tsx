import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  User,
  Search,
  ArrowRight,
  ArrowLeft,
  Share2,
  Check,
  Trophy,
  SlidersHorizontal,
  X,
  Lock,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { apiFetch } from "@/config/api";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type EventTypeFilter = "All" | "Hackathon" | "Bootcamp" | "Workshop" | "Challenge" | "Contest" | "Code Race";
type EventStatusFilter = "All" | "Live / Open" | "Upcoming" | "Past";
type EventModeFilter = "All" | "Offline" | "Online" | "Hybrid";

export interface EventSpeaker {
  name: string;
  role: string;
  companyOrOrg?: string;
  avatar?: string;
}

export interface EventData {
  id: string;
  serial: string; // e.g. "01", "02"
  title: string;
  tagline: string;
  description: string;
  type: "Hackathon" | "Bootcamp" | "Workshop" | "Challenge" | "Contest" | "Code Race";
  mode: "Online" | "Offline" | "Hybrid";
  participation: "Single" | "Team" | "Single or Team";
  teamSize?: string; // e.g. "2 - 4 Members"
  status: "REGISTRATION OPEN" | "UPCOMING" | "CONCLUDED" | "LIVE NOW";
  visibility?: "Public" | "Private";
  registrationOpen?: boolean;
  
  // Date & Time
  startDate: string;
  endDate?: string;
  time: string; // e.g. "10:00 AM - 05:00 PM IST"
  duration: string; // e.g. "36 Hours", "2 Days", "4 Hours"
  
  // Venue
  venue: string;
  locationDetails?: string; // e.g. "CEC Auditorium, Block 3" or "Discord Server"
  
  // Speaker / Guest (Optional)
  speakers?: EventSpeaker[];

  // Prize / Perks
  prizePool?: string;
  perks: string[];
  tags: string[];

  // Visuals & Action
  bannerImg: string;
  registrationUrl: string;
}

const defaultFallbackEvents: EventData[] = [
  {
    id: "cz-hack-4",
    serial: "01",
    title: "CODEZEN HACKATHON 4.0: SYNAPSE",
    tagline: "36-Hour Non-stop Engineering & Rapid Prototyping Flagship Sprint.",
    description: "The premier collegiate hackathon uniting student engineers, system architects, and UI designers. Build production-grade full-stack solutions, agentic workflows, or distributed systems from scratch within 36 hours. Mentorship from senior SREs and VC founders.",
    type: "Hackathon",
    mode: "Hybrid",
    participation: "Team",
    teamSize: "2 - 4 Members",
    status: "REGISTRATION OPEN",
    startDate: "MAR 20, 2026",
    endDate: "MAR 22, 2026",
    time: "09:00 AM IST Onwards",
    duration: "36 Continuous Hours",
    venue: "CGC Central Auditorium Complex",
    locationDetails: "On-Campus Lab 4 & Global Dev Discord",
    prizePool: "₹50,000 INR Pool + Cloud Credits",
    perks: ["Cash Prizes", "Exclusive Swag Kit", "Direct VC & Incubator Pitches", "Free Meals & RedBull"],
    tags: ["Full-Stack", "AI Agents", "Cloud Architecture", "Web3"],
    bannerImg: "/card-hackathon.jpg",
    registrationUrl: "/#contact",
    speakers: [
      {
        name: "Mayank Tiwari",
        role: "President & Founder",
        companyOrOrg: "CodeZen Ecosystem",
        avatar: "/leader-president.jpg",
      },
      {
        name: "Dev Lead Mentor",
        role: "Senior Distributed Engineer",
        companyOrOrg: "Tech Industry Guest",
        avatar: "/avatar-1.jpg",
      },
    ],
  },
  {
    id: "cz-race-1",
    serial: "02",
    title: "LIGHTNING CODE RACE: ALGO BLITZ",
    tagline: "A high-octane 90-minute competitive speed coding race against the clock.",
    description: "Solve escalating algorithmic and data structure puzzles in a head-to-head live leaderboard environment. Test your mental runtime complexity, memory handling, and edge-case agility with instant test runners.",
    type: "Code Race",
    mode: "Offline",
    participation: "Single",
    status: "REGISTRATION OPEN",
    startDate: "MAR 28, 2026",
    time: "03:30 PM - 05:00 PM IST",
    duration: "90 Minutes",
    venue: "Computer Labs 201 - 204",
    locationDetails: "CEC Block 2, CGC Campus",
    prizePool: "₹10,000 INR + Fast-track Team Lead Badge",
    perks: ["Top 3 Trophy", "Official Club Certificate", "Leaderboard Showcase"],
    tags: ["Algorithms", "C++", "Python", "Data Structures", "Speed"],
    bannerImg: "/card-learning.jpg",
    registrationUrl: "/#contact",
    speakers: [
      {
        name: "Competitive Coding Leads",
        role: "Grandmaster ICPC Finalists",
        companyOrOrg: "CodeZen Technical Wing",
        avatar: "/avatar-2.jpg",
      },
    ],
  },
  {
    id: "cz-camp-rust",
    serial: "03",
    title: "RUST & CONCURRENT SYSTEMS BOOTCAMP",
    tagline: "7-Day Deep Dive into Safe Concurrency, Memory Internals & Microservices.",
    description: "Ditch runtime garbage collectors and learn how to construct high-throughput distributed backends using Rust. We will implement memory-safe multi-threaded web servers, benchmark against Go and Node, and deploy to AWS.",
    type: "Bootcamp",
    mode: "Online",
    participation: "Single",
    status: "UPCOMING",
    startDate: "APR 05, 2026",
    endDate: "APR 12, 2026",
    time: "06:30 PM - 08:30 PM IST (Daily)",
    duration: "7 Interactive Days",
    venue: "Live Virtual Lab & Classroom",
    locationDetails: "Google Meet + Private GitHub Classroom",
    perks: ["Production Project Portfolio", "Verified Certificate", "Code Review by Staff"],
    tags: ["Rust", "Systems Programming", "gRPC", "Concurrency"],
    bannerImg: "/card-domains.jpg",
    registrationUrl: "/#contact",
    speakers: [
      {
        name: "Systems Architect",
        role: "Kernel & Rust Specialist",
        companyOrOrg: "Open Source Contributor",
        avatar: "/avatar-3.jpg",
      },
    ],
  },
  {
    id: "cz-wksh-laravel-react",
    serial: "04",
    title: "FULL-STACK ARCHITECTURE MASTERCLASS",
    tagline: "Building Multi-Tenant Production Apps with Laravel 12, React 19 & Redis.",
    description: "An intensive masterclass walking through enterprise web engineering. Covers session/token zero-leak authentication, RBAC hierarchy, database query indexing, caching strategies, and robust React client state architectures.",
    type: "Workshop",
    mode: "Offline",
    participation: "Single or Team",
    teamSize: "1 - 2 Participants",
    status: "UPCOMING",
    startDate: "APR 18, 2026",
    time: "10:00 AM - 04:30 PM IST",
    duration: "6.5 Hours (Hands-on)",
    venue: "Seminar Hall 1",
    locationDetails: "Main Admin Block, CGC University",
    perks: ["Starter Code Repository", "Digital Badge", "1-on-1 Debugging Help"],
    tags: ["Laravel 12", "React 19", "MySQL", "Redis", "Security"],
    bannerImg: "/card-learning.jpg",
    registrationUrl: "/#contact",
    speakers: [
      {
        name: "Mayank Tiwari",
        role: "Full-Stack Engineer & Founder",
        companyOrOrg: "CodeZen",
        avatar: "/leader-president.jpg",
      },
    ],
  },
  {
    id: "cz-chal-cyber",
    serial: "05",
    title: "CAPTURE THE FLAG: CYBERSHIELD '26",
    tagline: "48-Hour Jeopardy-Style Cybersecurity and Reverse Engineering Challenge.",
    description: "Compete across categories including Binary Exploitation, Web Security, Cryptography, Forensics, and Reverse Engineering. Find hidden flags, bypass firewalls, and demonstrate real-world defensive and offensive tactics.",
    type: "Challenge",
    mode: "Hybrid",
    participation: "Team",
    teamSize: "1 - 3 Members",
    status: "UPCOMING",
    startDate: "MAY 02, 2026",
    endDate: "MAY 04, 2026",
    time: "12:00 PM IST Kickoff",
    duration: "48 Hours",
    venue: "CTF Portal & Campus War Room",
    locationDetails: "Dedicated VPN + CEC Computer Center",
    prizePool: "₹25,000 INR Cash + Security Licenses",
    perks: ["Hall of Fame Listing", "Industry Interview Referrals", "Cash Awards"],
    tags: ["Cybersecurity", "CTF", "Reverse Engineering", "Infosec"],
    bannerImg: "/card-hackathon.jpg",
    registrationUrl: "/#contact",
    speakers: [
      {
        name: "Red Team Specialist",
        role: "Certified OSCP Security Researcher",
        companyOrOrg: "External Security Partner",
        avatar: "/avatar-4.jpg",
      },
    ],
  },
  {
    id: "cz-arch-ideathon",
    serial: "06",
    title: "INNOVATION CONTEST: CGC BUILDATHON",
    tagline: "Campus Tech & Sustainability Hardware + Software Grand Showcase.",
    description: "The grand annual product pitch contest where over 120 student teams designed and demonstrated working prototypes before academic evaluators and industrial jury members.",
    type: "Contest",
    mode: "Offline",
    participation: "Team",
    teamSize: "3 - 5 Members",
    status: "CONCLUDED",
    startDate: "OCT 14, 2025",
    endDate: "OCT 15, 2025",
    time: "Concluded",
    duration: "2 Full Days",
    venue: "CGC Auditorium & Innovation Gallery",
    locationDetails: "Landran Campus",
    prizePool: "₹40,000 INR Awarded",
    perks: ["Incubation Support", "MOU Signing", "Project Seed Grants"],
    tags: ["Innovation", "Hardware & IoT", "AI", "Startup Pitch"],
    bannerImg: "/card-domains.jpg",
    registrationUrl: "",
    speakers: [
      {
        name: "Faculty Coordinator",
        role: "Mentor & Jury Head",
        companyOrOrg: "CGC University",
        avatar: "/leader-faculty.jpg",
      },
    ],
  },
];

export default function Events() {
  const navigate = useNavigate();
  const [eventsList, setEventsList] = useState<EventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<EventTypeFilter>("All");
  const [selectedStatus, setSelectedStatus] = useState<EventStatusFilter>("All");
  const [selectedMode, setSelectedMode] = useState<EventModeFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventModal, setSelectedEventModal] = useState<EventData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [regSuccessModal, setRegSuccessModal] = useState<EventData | null>(null);
  const [authPromptModal, setAuthPromptModal] = useState<EventData | null>(null);
  const [profileIncompleteModal, setProfileIncompleteModal] = useState<{
    event: EventData;
    missingFields: string[];
  } | null>(null);

  // Lock background scrolling whenever any public event modal is open
  const isAnyEventModalOpen = !!(
    selectedEventModal ||
    authPromptModal ||
    regSuccessModal ||
    profileIncompleteModal
  );
  useModalScrollLock(isAnyEventModalOpen);

  useEffect(() => {
    const token = localStorage.getItem("codezen_token");
    setIsAuthenticated(!!token);

    // Fetch actual events and authenticated user registrations from backend database
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/events");
      if (res.ok) {
        const data = await res.json();

        // Sync registered events directly from backend database source of truth
        if (Array.isArray(data.user_registered_event_ids)) {
          setRegisteredEventIds(data.user_registered_event_ids);
          localStorage.setItem("codezen_registered_events", JSON.stringify(data.user_registered_event_ids));
        } else {
          // If not authenticated or no DB registrations, clean local stale state
          setRegisteredEventIds([]);
          localStorage.removeItem("codezen_registered_events");
        }

        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          const mapped: EventData[] = data.events.map((ev: any, idx: number) => {
            const serialNum = String(idx + 1).padStart(2, "0");
            return {
              id: String(ev.id),
              serial: serialNum,
              title: ev.title || "Untitled Sprint",
              tagline: ev.tagline || "",
              description: ev.description || "",
              type: (ev.type as any) || "Workshop",
              mode: (ev.mode as any) || "Offline",
              participation: (ev.participation as any) || "Single",
              teamSize: ev.team_size || (ev.participation === "Team" ? "2 - 4 Members" : undefined),
              status: (ev.status as any) || "UPCOMING",
              visibility: (ev.visibility as any) || "Public",
              registrationOpen: ev.registration_open !== false,
              startDate: ev.start_date || "TBA",
              endDate: ev.end_date || undefined,
              time: ev.time || "Schedule TBA",
              duration: ev.duration || "Full Day",
              venue: ev.venue || "CGC Campus",
              locationDetails: ev.location_details || "",
              prizePool: ev.prize_pool || undefined,
              perks: Array.isArray(ev.perks) ? ev.perks : ["Certificate of Participation", "Mentorship Access"],
              tags: Array.isArray(ev.tags) ? ev.tags : ["Engineering", "CodeZen"],
              bannerImg: ev.banner_img || "/card-hackathon.jpg",
              registrationUrl: ev.registration_url || "/#contact",
              speakers: Array.isArray(ev.speakers) && ev.speakers.length > 0
                ? ev.speakers
                : [
                    {
                      name: "Mayank Tiwari",
                      role: "President",
                      companyOrOrg: "CodeZen Ecosystem",
                      avatar: "/leader-president.jpg",
                    },
                  ],
            };
          });
          setEventsList(mapped);
          return;
        }
      }
      setEventsList(defaultFallbackEvents);
    } catch {
      setEventsList(defaultFallbackEvents);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = async (event: EventData, e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (event.registrationOpen === false) {
      return; // Registrations closed
    }

    if (!isAuthenticated) {
      // Require user to login or register first
      setAuthPromptModal(event);
      return;
    }

    // Authenticated user registration flow via backend API
    try {
      const res = await apiFetch(`/events/${event.id}/register`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        // mark as registered locally
        if (!registeredEventIds.includes(event.id)) {
          const updated = [...registeredEventIds, event.id];
          setRegisteredEventIds(updated);
          localStorage.setItem("codezen_registered_events", JSON.stringify(updated));
        }
        setRegSuccessModal(event);
      } else if (data?.incomplete_profile) {
        setProfileIncompleteModal({
          event,
          missingFields: data.missing_fields || ["Academic details", "Phone number"],
        });
      } else if (data?.error) {
        alert(data.error);
      }
    } catch {
      alert("Registration request failed. Please check your network connection.");
    }
  };

  const handleShare = (event: EventData, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events#${event.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredEvents = useMemo(() => {
    return eventsList.filter((ev) => {
      // Type
      if (selectedType !== "All" && ev.type !== selectedType) return false;

      // Status
      if (selectedStatus === "Live / Open" && ev.status !== "REGISTRATION OPEN" && ev.status !== "LIVE NOW") return false;
      if (selectedStatus === "Upcoming" && ev.status !== "UPCOMING") return false;
      if (selectedStatus === "Past" && ev.status !== "CONCLUDED") return false;

      // Mode
      if (selectedMode !== "All" && ev.mode !== selectedMode) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesTagline = ev.tagline.toLowerCase().includes(q);
        const matchesDesc = ev.description.toLowerCase().includes(q);
        const matchesVenue = ev.venue.toLowerCase().includes(q);
        const matchesTags = ev.tags.some((t) => t.toLowerCase().includes(q));
        const matchesSpeakers = ev.speakers?.some((s) => s.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTagline && !matchesDesc && !matchesVenue && !matchesTags && !matchesSpeakers) {
          return false;
        }
      }

      return true;
    });
  }, [eventsList, selectedType, selectedStatus, selectedMode, searchQuery]);

  // Featured Event (highest priority active sprint from actual database)
  const heroEvent = useMemo(() => {
    if (eventsList.length === 0) return null;
    const openSprint = eventsList.find((e) => e.status === "REGISTRATION OPEN" || e.status === "LIVE NOW");
    return openSprint || eventsList[0];
  }, [eventsList]);

  return (
    <div className="bg-black text-white min-h-screen relative font-sans selection:bg-white selection:text-black">
      {/* Global Header Navigation */}
      <Navigation />

      {/* Subtle Dot Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top Header / Breadcrumb Hero - Refined & Proportional */}
      <header className="relative pt-28 md:pt-36 pb-8 px-6 md:px-12 lg:px-20 border-b border-white/10 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="group flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
                <span>INDEX</span>
              </Link>
              <span className="text-zinc-600 text-xs">/</span>
              <span className="text-xs font-mono uppercase tracking-widest text-white font-semibold">
                EVENTS & SPRINTS
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[10px] font-mono tracking-widest uppercase text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{eventsList.filter((e) => e.status === "REGISTRATION OPEN" || e.status === "LIVE NOW").length} Active Registrations</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-white/20 bg-white/5 text-[9px] font-mono tracking-widest uppercase text-zinc-400 mb-2">
                <span>TECHNICAL EVENTS & SPRINTS</span>
                <span>•</span>
                <span>CGC UNIVERSITY</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                EVENTS & HACKATHONS
              </h1>
            </div>

            <p className="text-xs font-mono text-zinc-400 max-w-md leading-relaxed">
              Explore upcoming hackathons, speed code races, technical bootcamps, and architecture masterclasses hosted by CodeZen.
            </p>
          </div>
        </div>
      </header>

      {/* Featured Highlight Banner (Top Showcase) */}
      {heroEvent && (
        <section className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto pt-10">
          <div className="relative rounded-3xl border border-white/20 bg-gradient-to-b from-white/10 via-zinc-950 to-black p-6 sm:p-10 overflow-hidden group">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest">
                    FLAGSHIP EVENT
                  </span>
                  <span className="px-3 py-1 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono tracking-widest uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {heroEvent.status}
                  </span>
                  <span className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[10px] font-mono text-zinc-400 uppercase">
                    {heroEvent.type}
                  </span>
                  <span className="px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[10px] font-mono text-zinc-400 uppercase">
                    {heroEvent.mode}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                  {heroEvent.title}
                </h2>

                <p className="text-xs sm:text-sm font-mono text-zinc-300 leading-relaxed max-w-xl">
                  {heroEvent.tagline}
                </p>

                {/* Event Key Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/10 font-mono text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Date & Time</span>
                    <span className="font-semibold text-white">{heroEvent.startDate}</span>
                    <span className="text-[10px] text-zinc-400 block">{heroEvent.duration}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Format</span>
                    <span className="font-semibold text-white">{heroEvent.participation}</span>
                    <span className="text-[10px] text-zinc-400 block">{heroEvent.teamSize || "Single"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Venue</span>
                    <span className="font-semibold text-white truncate block">{heroEvent.venue}</span>
                    <span className="text-[10px] text-zinc-400 block truncate">{heroEvent.locationDetails}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Prize Pool</span>
                    <span className="font-semibold text-emerald-400">{heroEvent.prizePool || "Certificates"}</span>
                  </div>
                </div>

                {/* Speaker Snippet */}
                {heroEvent.speakers && heroEvent.speakers.length > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Key Mentors:</span>
                    <div className="flex items-center gap-2">
                      {heroEvent.speakers.map((spk, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/5">
                          {spk.avatar ? (
                            <img src={spk.avatar} alt={spk.name} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center font-mono">
                              {spk.name[0]}
                            </div>
                          )}
                          <span className="text-xs font-mono text-zinc-300 font-medium">{spk.name}</span>
                          <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">({spk.role})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  {registeredEventIds.includes(heroEvent.id) ? (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold text-xs uppercase tracking-wider cursor-default shadow-md"
                    >
                      <Check size={14} />
                      <span>Seat Registered</span>
                    </button>
                  ) : heroEvent.registrationOpen === false ? (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-500 font-mono font-bold text-xs uppercase tracking-wider cursor-not-allowed shadow-md"
                    >
                      <Lock size={13} />
                      <span>Registrations Closed</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegisterClick(heroEvent)}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-md group"
                    >
                      <span>Register Now</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedEventModal(heroEvent)}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-white/20 hover:border-white font-mono text-xs uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
                  >
                    <span>View Full Brief</span>
                  </button>

                  <button
                    onClick={(e) => handleShare(heroEvent, e)}
                    className="p-3.5 rounded-full border border-white/20 hover:border-white text-zinc-400 hover:text-white transition-colors"
                    title="Copy Link to Event"
                  >
                    {copiedId === heroEvent.id ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                  </button>
                </div>
              </div>

              {/* Cover Visual */}
              <div className="lg:col-span-5">
                <div className="relative aspect-video sm:aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 bg-zinc-900 group-hover:border-white/40 transition-colors">
                  <img
                    src={heroEvent.bannerImg}
                    alt={heroEvent.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-[11px] text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-zinc-500" />
                      {heroEvent.venue}
                    </span>
                    <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 border border-white/15">
                      {heroEvent.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Control Panel: Filters, Tabs, Modes & Live Search */}
      <section className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto pt-16 pb-8">
        <div className="border border-white/15 rounded-3xl bg-zinc-950/80 p-5 sm:p-6 backdrop-blur-sm space-y-5">
          {/* Top Row: Search and Status/Mode Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search events by name, stack, description, venue or speaker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-2xl bg-white/5 border border-white/15 focus:border-white text-xs sm:text-sm font-mono text-white placeholder:text-zinc-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mode & Status Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono">
                {(["All", "Live / Open", "Upcoming", "Past"] as EventStatusFilter[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-xl uppercase tracking-wider text-[11px] transition-colors ${
                      selectedStatus === st
                        ? "bg-white text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Mode Filter */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono">
                {(["All", "Offline", "Online", "Hybrid"] as EventModeFilter[]).map((md) => (
                  <button
                    key={md}
                    onClick={() => setSelectedMode(md)}
                    className={`px-3 py-1.5 rounded-xl uppercase tracking-wider text-[11px] transition-colors ${
                      selectedMode === md
                        ? "bg-white text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {md}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Event Type Pills (Workshop, Bootcamp, Challenge, Contest, Code Race, etc.) */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 shrink-0 hidden sm:inline">
                EVENT TYPE:
              </span>
              {(["All", "Hackathon", "Bootcamp", "Workshop", "Challenge", "Contest", "Code Race"] as EventTypeFilter[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all ${
                      selectedType === t
                        ? "bg-white text-black font-bold"
                        : "border border-white/15 text-zinc-400 hover:text-white hover:border-white/30 bg-white/5"
                    }`}
                  >
                    {t}
                  </button>
                )
              )}
            </div>

            <div className="text-right text-[11px] font-mono text-zinc-500 shrink-0 hidden md:block">
              Showing <span className="text-white font-bold">{filteredEvents.length}</span> Events
            </div>
          </div>
        </div>
      </section>

      {/* Main Events Grid */}
      <section className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto pb-28">
        {loading ? (
          <div className="py-24 text-center border border-white/10 rounded-3xl p-8 bg-zinc-950/40">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">
              Loading Verified Events from CodeZen Ecosystem...
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-white/15 rounded-3xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-zinc-500 mb-4">
              <SlidersHorizontal size={20} />
            </div>
            <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider mb-2">
              No Matching Events Found
            </h3>
            <p className="text-zinc-400 font-mono text-xs max-w-md mx-auto mb-6">
              We couldn't find any events matching your current filter combinations. Try resetting filters or searching with different keywords.
            </p>
            <button
              onClick={() => {
                setSelectedType("All");
                setSelectedStatus("All");
                setSelectedMode("All");
                setSearchQuery("");
              }}
              className="px-6 py-2.5 rounded-full bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const isOpen = event.status === "REGISTRATION OPEN";
              const isLive = event.status === "LIVE NOW";
              const isPast = event.status === "CONCLUDED";

              return (
                <div
                  key={event.id}
                  id={event.id}
                  className="group relative rounded-3xl border border-white/15 bg-zinc-950/80 p-6 flex flex-col justify-between hover:border-white/35 transition-all duration-300 shadow-lg hover:shadow-2xl"
                >
                  <div>
                    {/* Top Status & Serial Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-400">#{event.serial}</span>
                        <span className="px-2.5 py-0.5 rounded-full border border-white/15 bg-white/5 text-[9px] font-mono uppercase tracking-widest text-zinc-300">
                          {event.type}
                        </span>
                      </div>

                      {/* Status Indicator */}
                      <span
                        className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                          isOpen || isLive
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-bold"
                            : isPast
                            ? "border-white/10 text-zinc-500 bg-white/5"
                            : "border-white/20 text-zinc-300 bg-white/5"
                        }`}
                      >
                        {(isOpen || isLive) && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                        {event.status}
                      </span>
                    </div>

                    {/* Image Banner */}
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 mb-5 bg-zinc-900">
                      <img
                        src={event.bannerImg}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      
                      {/* Mode & Participation Tag Overlays */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-zinc-300">
                        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 uppercase">
                          {event.mode} MODE
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 uppercase flex items-center gap-1">
                          {event.participation === "Team" ? <Users size={11} /> : <User size={11} />}
                          {event.participation} {event.teamSize ? `(${event.teamSize})` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-zinc-200 transition-colors leading-snug mb-2">
                      {event.title}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 leading-relaxed line-clamp-2 mb-4">
                      {event.tagline}
                    </p>

                    {/* Key Event Metadata Grid (Date, Time, Venue) */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2 mb-4 font-mono text-xs">
                      {/* Date & Time */}
                      <div className="flex items-start gap-2 text-zinc-300">
                        <Calendar size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white block leading-tight">
                            {event.startDate} {event.endDate ? `- ${event.endDate}` : ""}
                          </span>
                          <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5">
                            {event.time} ({event.duration})
                          </span>
                        </div>
                      </div>

                      {/* Venue */}
                      <div className="flex items-start gap-2 text-zinc-300 pt-1.5 border-t border-white/10">
                        <MapPin size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white block leading-tight truncate">
                            {event.venue}
                          </span>
                          {event.locationDetails && (
                            <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5 truncate">
                              {event.locationDetails}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prize or Participation Perk */}
                      {event.prizePool && (
                        <div className="flex items-center gap-2 text-emerald-400 pt-1.5 border-t border-white/10 text-[11px] font-semibold">
                          <Trophy size={13} className="text-emerald-400 shrink-0" />
                          <span>{event.prizePool}</span>
                        </div>
                      )}
                    </div>

                    {/* Optional Speaker / Guest Preview */}
                    {event.speakers && event.speakers.length > 0 && (
                      <div className="mb-4 pt-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1.5">
                          Speaker / Guest:
                        </span>
                        <div className="flex items-center gap-2">
                          {event.speakers.map((spk, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white/5 border border-white/10"
                            >
                              {spk.avatar ? (
                                <img
                                  src={spk.avatar}
                                  alt={spk.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center font-mono text-white">
                                  {spk.name[0]}
                                </div>
                              )}
                              <div className="text-[11px] font-mono leading-none">
                                <span className="text-white font-medium block">{spk.name}</span>
                                {spk.companyOrOrg && (
                                  <span className="text-[9px] text-zinc-400 block">{spk.companyOrOrg}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-zinc-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom CTA Actions */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    {registeredEventIds.includes(event.id) ? (
                      <button
                        disabled
                        className="flex-1 py-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold text-xs uppercase tracking-wider text-center cursor-default flex items-center justify-center gap-1.5"
                      >
                        <Check size={13} />
                        <span>Registered</span>
                      </button>
                    ) : event.registrationOpen === false ? (
                      <button
                        disabled
                        className="flex-1 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono font-bold text-[11px] uppercase tracking-wider text-center cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Lock size={12} />
                        <span>Registration Closed</span>
                      </button>
                    ) : isOpen ? (
                      <button
                        onClick={() => handleRegisterClick(event)}
                        className="flex-1 py-3 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider text-center hover:bg-zinc-200 transition-colors shadow-md flex items-center justify-center gap-1.5"
                      >
                        {!isAuthenticated && <Lock size={12} className="text-zinc-600" />}
                        <span>Register Seat</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedEventModal(event)}
                        className="flex-1 py-3 rounded-2xl border border-white/20 hover:border-white font-mono text-xs uppercase tracking-wider text-center text-zinc-300 hover:text-white transition-colors"
                      >
                        {isPast ? "View Archive" : "Event Brief"}
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedEventModal(event)}
                      title="Inspect Full Details"
                      className="w-11 h-11 rounded-2xl border border-white/15 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-colors"
                    >
                      <ArrowRight size={14} />
                    </button>

                    <button
                      onClick={(e) => handleShare(event, e)}
                      title="Share Event Link"
                      className="w-11 h-11 rounded-2xl border border-white/15 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-colors"
                    >
                      {copiedId === event.id ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Comprehensive Event Details Modal */}
      {selectedEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-10 max-w-2xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto overscroll-contain">
            {/* Close Button */}
            <button
              onClick={() => setSelectedEventModal(null)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full border border-white/20 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold text-zinc-400">EVENT #{selectedEventModal.serial}</span>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-white/20 bg-white/5 text-zinc-300">
                {selectedEventModal.type}
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-white/20 bg-white/5 text-zinc-300">
                {selectedEventModal.mode} MODE
              </span>
              <span
                className={`text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                  selectedEventModal.status === "REGISTRATION OPEN"
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-bold"
                    : "border-white/20 text-zinc-300 bg-white/5"
                }`}
              >
                {selectedEventModal.status}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2">
              {selectedEventModal.title}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 mb-6 leading-relaxed">
              {selectedEventModal.tagline}
            </p>

            {/* Detailed Parameters Grid */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs mb-6">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Schedule & Timeline</span>
                <span className="font-bold text-white block">
                  {selectedEventModal.startDate} {selectedEventModal.endDate ? `- ${selectedEventModal.endDate}` : ""}
                </span>
                <span className="text-zinc-400 block">{selectedEventModal.time}</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Duration: {selectedEventModal.duration}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Location / Venue</span>
                <span className="font-bold text-white block">{selectedEventModal.venue}</span>
                <span className="text-zinc-400 block">{selectedEventModal.locationDetails || "Campus Venue"}</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Mode: {selectedEventModal.mode}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Participation Type</span>
                <span className="font-bold text-white block">{selectedEventModal.participation} Participation</span>
                {selectedEventModal.teamSize && (
                  <span className="text-zinc-400 block">Team Size: {selectedEventModal.teamSize}</span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Prizes & Recognition</span>
                <span className="font-bold text-emerald-400 block">
                  {selectedEventModal.prizePool || "Certificates of Excellence"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">
                  Event Brief & Syllabus
                </h4>
                <p className="text-xs sm:text-sm font-mono text-zinc-300 leading-relaxed">
                  {selectedEventModal.description}
                </p>
              </div>

              {/* Perks / Benefits */}
              {selectedEventModal.perks && selectedEventModal.perks.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">
                    Key Perks & Deliverables
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedEventModal.perks.map((perk, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-white/5 font-mono text-xs text-zinc-300"
                      >
                        <Check size={12} className="text-emerald-400 shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speaker / Guest Presentation */}
              {selectedEventModal.speakers && selectedEventModal.speakers.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">
                    Distinguished Speaker / Guest Mentors
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEventModal.speakers.map((spk, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/5"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-zinc-800 shrink-0">
                          {spk.avatar ? (
                            <img src={spk.avatar} alt={spk.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-mono">
                              {spk.name[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold text-white">{spk.name}</p>
                          <p className="text-[10px] font-mono text-zinc-400">{spk.role}</p>
                          {spk.companyOrOrg && (
                            <p className="text-[9px] font-mono text-zinc-500">{spk.companyOrOrg}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom CTA */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              {registeredEventIds.includes(selectedEventModal.id) ? (
                <button
                  disabled
                  className="flex-1 py-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-default"
                >
                  <Check size={14} />
                  <span>Already Registered</span>
                </button>
              ) : selectedEventModal.registrationOpen === false ? (
                <button
                  disabled
                  className="flex-1 py-4 rounded-2xl border border-red-500/20 bg-red-500/10 font-mono text-xs uppercase tracking-wider text-center text-red-400 cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock size={13} />
                  <span>Registrations Closed</span>
                </button>
              ) : selectedEventModal.status === "REGISTRATION OPEN" ? (
                <button
                  onClick={() => {
                    const ev = selectedEventModal;
                    setSelectedEventModal(null);
                    handleRegisterClick(ev);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider text-center hover:bg-zinc-200 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  {!isAuthenticated && <Lock size={13} className="text-zinc-600" />}
                  <span>Register Now ({selectedEventModal.participation})</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-4 rounded-2xl border border-white/10 font-mono text-xs uppercase tracking-wider text-center text-zinc-500 bg-white/5 cursor-not-allowed"
                >
                  {selectedEventModal.status === "CONCLUDED" ? "Event Concluded" : "Registrations Opening Soon"}
                </button>
              )}

              <button
                onClick={() => setSelectedEventModal(null)}
                className="px-6 py-4 rounded-2xl border border-white/20 hover:border-white text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICATION REQUIRED MODAL */}
      {authPromptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setAuthPromptModal(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full border border-white/20 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 mx-auto flex items-center justify-center text-white mb-4">
              <Lock size={24} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">
              <span>Authentication Required</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">
              Sign In to Register
            </h3>

            <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-4">
              To reserve your seat and participate in <span className="text-white font-bold">{authPromptModal.title}</span>, please log in or create an account.
            </p>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-6 text-left font-mono text-[11px] text-zinc-400 space-y-1">
              <div><span className="text-zinc-500 uppercase">Format:</span> <span className="text-white">{authPromptModal.participation} ({authPromptModal.mode})</span></div>
              <div><span className="text-zinc-500 uppercase">Dates:</span> <span className="text-white">{authPromptModal.startDate}</span></div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to={`/login?redirect=/events`}
                className="w-full py-3.5 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-md"
              >
                <span>Login to Account</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                to="/register"
                className="w-full py-3.5 rounded-2xl border border-white/20 hover:border-white text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center transition-colors"
              >
                <span>Create New Membership</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION SUCCESS MODAL */}
      {regSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setRegSuccessModal(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full border border-white/20 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 mb-4">
              <Check size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-3">
              <span>Registration Confirmed</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">
              You're In!
            </h3>

            <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-5">
              Your seat for <span className="text-white font-bold">{regSuccessModal.title}</span> has been confirmed. Your ticket pass and instructions are saved to your Dashboard.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-3.5 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-md"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => setRegSuccessModal(null)}
                className="w-full py-3.5 rounded-2xl border border-white/20 hover:border-white text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE INCOMPLETE MODAL */}
      {profileIncompleteModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div data-lenis-prevent className="bg-zinc-950 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center max-h-[90vh] overflow-y-auto overscroll-contain">
            <button
              onClick={() => setProfileIncompleteModal(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full border border-white/20 hover:border-white flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 mb-4">
              <Lock size={26} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-3">
              <span>Complete Profile Required</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2">
              Action Required
            </h3>

            <p className="text-xs font-mono text-zinc-400 leading-relaxed mb-4">
              To participate in <span className="text-white font-bold">{profileIncompleteModal.event.title}</span>, please provide your student ID, contact, and academic details for verification and badge generation.
            </p>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl mb-5 text-left font-mono text-[11px] text-zinc-400">
              <span className="block text-[10px] uppercase text-zinc-500 font-bold mb-1">Missing details:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-white">
                {profileIncompleteModal.missingFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/dashboard/profile?complete_profile=1")}
                className="w-full py-3.5 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-md"
              >
                <span>Complete Profile Now</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => setProfileIncompleteModal(null)}
                className="w-full py-3.5 rounded-2xl border border-white/20 hover:border-white text-zinc-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Minimalist Editorial Footer */}
      <footer className="border-t border-white/10 py-10 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-zinc-500">
        <div>
          <span>Built by Mayank Tiwari</span>
          <span className="mx-2">·</span>
          <span>CodeZen Ecosystem © 2026</span>
        </div>

        <div className="flex items-center gap-6 text-zinc-400">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/members" className="hover:text-white transition-colors">Members</Link>
          <Link to="/events" className="text-white hover:underline">Events</Link>
          <a href="/#contact" className="hover:text-white transition-colors">Join</a>
        </div>
      </footer>
    </div>
  );
}
