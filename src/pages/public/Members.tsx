import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Github, 
  Linkedin, 
  Mail, 
  ArrowLeft, 
  ArrowRight,
  Crown
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { API_ROOT } from "@/config/api";

interface Member {
  id: number;
  name: string;
  role: string;
  domain: string;
  isLead: boolean;
  specialty: string;
  photo: string;
  initials: string;
  github?: string;
  linkedin?: string;
  email?: string;
}

export default function Members() {
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, leads: 0, domains: 0 });

  useEffect(() => {
    fetch(`${API_ROOT}/members`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.members)) {
          const mapped: Member[] = data.members.map((u: any) => {
            const names = (u.name || "").trim().split(" ");
            const initials =
              names.length >= 2
                ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                : (u.name || "TM").slice(0, 2).toUpperCase();

            const isLead =
              u.type === "Lead" ||
              u.role === "Admin" ||
              u.type === "Admin" ||
              (u.position || "").toLowerCase().includes("president") ||
              (u.position || "").toLowerCase().includes("lead") ||
              (u.position || "").toLowerCase().includes("head") ||
              (u.position || "").toLowerCase().includes("coordinator");

            return {
              id: u.id,
              name: u.name,
              role: u.position || (isLead ? "Domain Lead" : "Core Member"),
              domain: u.team || "Technical",
              isLead: isLead,
              specialty: u.tag || u.bio || `${u.team || "Technical"} Wing Member`,
              photo: u.avatar || "",
              initials: initials,
              github: u.github || undefined,
              linkedin: u.linkedin || undefined,
              email: u.email || undefined,
            };
          });

          setMembersList(mapped);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute available domains dynamically from the actual members in the database
  const domains = useMemo(() => {
    const uniqueTeams = Array.from(new Set(membersList.map((m) => m.domain).filter(Boolean)));
    return ["All", "Leads", ...uniqueTeams];
  }, [membersList]);

  const filteredMembers = useMemo(() => {
    return membersList.filter((m) => {
      const matchesDomain =
        activeDomain === "All"
          ? true
          : activeDomain === "Leads"
          ? m.isLead
          : m.domain === activeDomain;

      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.specialty.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDomain && matchesSearch;
    });
  }, [membersList, activeDomain, searchQuery]);

  // Separate leads and working members for clear tiering
  const leads = useMemo(() => filteredMembers.filter(m => m.isLead), [filteredMembers]);
  const activeWorkingMembers = useMemo(() => filteredMembers.filter(m => !m.isLead), [filteredMembers]);
  return (
    <div className="min-h-screen w-full bg-black text-white font-sans selection:bg-white selection:text-black relative overflow-x-hidden">
      
      {/* Fixed Brand Logo */}
      <div className="fixed top-5 left-6 md:top-6 md:left-8 z-50 mix-blend-difference">
        <Link to="/" className="group flex items-start">
          <h1 className="font-sans font-black text-xl md:text-2xl tracking-tighter text-white">
            CODEZEN
            <span className="text-[10px] md:text-xs font-medium ml-1 text-neutral-400">Club</span>
          </h1>
        </Link>
      </div>

      <Navigation />

      {/* Subtle Dot Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1.1px, transparent 1.1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 md:px-10 pt-20 md:pt-24 pb-20">
        
        {/* ======================================================== */}
        {/* COMPACT HEADER: Low vertical footprint so cards show fast */}
        {/* ======================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6 mb-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 mb-1">
              — 01 / TEAM DIRECTORY —
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              Core Leads & Members
            </h1>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs text-white/60">
            <div>
              <span className="text-white font-black text-base mr-1">{stats.total || membersList.length}</span>
              <span>Total Team</span>
            </div>
            <div>
              <span className="text-white font-black text-base mr-1">{stats.leads || membersList.filter(m => m.isLead).length}</span>
              <span>Domain Leads</span>
            </div>
            <div>
              <span className="text-white font-black text-base mr-1">{stats.domains || Math.max(0, domains.length - 2)}</span>
              <span>Domains</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COMPACT CONTROLS: Domain Tabs & Search in 1 Line          */}
        {/* ======================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          {/* Domain Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {domains.map((dom) => {
              const count =
                dom === "All"
                  ? membersList.length
                  : dom === "Leads"
                  ? membersList.filter((m) => m.isLead).length
                  : membersList.filter((m) => m.domain === dom).length;

              return (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setActiveDomain(dom)}
                  className={`px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
                    activeDomain === dom
                      ? "bg-white text-black shadow-md"
                      : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/15 border border-white/10"
                  }`}
                >
                  <span>{dom}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                      activeDomain === dom ? "bg-black text-white" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Bar */}
          <div className="relative w-full lg:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 focus:border-white focus:bg-white/10 font-mono text-xs text-white placeholder:text-white/35 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
            <p className="font-mono text-xs uppercase tracking-widest text-white/50">Loading Team Directory...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center border border-white/10 rounded-3xl bg-white/[0.02]">
            <p className="font-mono text-xs text-white/40 uppercase tracking-widest">
              No members found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* SECTION 1: CORE LEADS & OFFICERS                         */}
            {/* ======================================================== */}
            {leads.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-white/70 font-bold">
                    Core Team Leads & Officers ({leads.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {leads.map((member) => (
                    <MemberCard key={member.name + member.role} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 2: ACTIVE WORKING MEMBERS & CONTRIBUTORS          */}
            {/* ======================================================== */}
            {activeWorkingMembers.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-2 h-2 rounded-full bg-white/40" />
                  <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-white/50 font-bold">
                    Working Members & Developers ({activeWorkingMembers.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {activeWorkingMembers.map((member) => (
                    <MemberCard key={member.name + member.role} member={member} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* COMPACT BOTTOM RECRUITMENT BANNER                        */}
        {/* ======================================================== */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white text-black flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-1">
              Want to Build with CodeZen?
            </h3>
            <p className="font-sans text-neutral-600 text-xs sm:text-sm max-w-lg">
              Recruitment opens every semester across Technical, Design, Management, and Marketing domains.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/#contact"
              className="w-full md:w-auto px-6 py-3 rounded-full bg-black text-white hover:bg-neutral-800 font-mono text-xs uppercase tracking-wider font-bold transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Apply for Core Team</span>
              <ArrowRight size={13} />
            </Link>

            <Link
              to="/"
              className="w-full md:w-auto px-5 py-3 rounded-full border border-black/20 hover:border-black font-mono text-xs uppercase tracking-wider font-bold transition-colors text-center flex items-center justify-center gap-2"
            >
              <ArrowLeft size={13} />
              <span>Back Home</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Compact Architectural Member Card
function MemberCard({ member }: { member: Member }) {
  return (
    <div className="group p-4 rounded-[26px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/35 transition-all duration-300 flex flex-col justify-between shadow-md hover:-translate-y-1">
      <div>
        {/* Portrait Frame */}
        <div className="relative w-full aspect-[4/4.2] rounded-xl overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-white/25 transition-colors mb-3.5">
          <img
            src={member.photo}
            alt={member.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.member-fallback') as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />

          {/* Fallback Monogram Frame */}
          <div className="member-fallback w-full h-full hidden flex-col items-center justify-center bg-white/5 text-white/40">
            <span className="font-mono text-2xl font-black">{member.initials}</span>
          </div>

          {/* Lead or Domain Tag Floating on Top-Left */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15 text-white font-mono text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
            {member.isLead && <Crown size={10} className="text-white" />}
            <span>{member.isLead ? "LEAD" : member.domain}</span>
          </div>

          {/* Active Status Pulse */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/15">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-[7px] font-mono text-white/80 uppercase tracking-widest font-bold">
              Active
            </span>
          </div>
        </div>

        {/* Member Details */}
        <div className="px-0.5">
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-white/50 block mb-0.5">
            {member.role}
          </span>

          <h4 className="text-base font-black tracking-tight text-white mb-1 leading-snug group-hover:text-white transition-colors">
            {member.name}
          </h4>

          <p className="text-[11px] font-mono text-white/50 leading-relaxed line-clamp-2">
            {member.specialty}
          </p>
        </div>
      </div>

      {/* Direct Social Links */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {member.github && (
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white transition-colors"
              title="GitHub"
            >
              <Github size={12} />
            </a>
          )}
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white transition-colors"
              title="LinkedIn"
            >
              <Linkedin size={12} />
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white transition-colors"
              title="Email"
            >
              <Mail size={12} />
            </a>
          )}
        </div>

        <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">
          {member.domain}
        </span>
      </div>
    </div>
  );
}
