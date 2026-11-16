import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Github, 
  Linkedin, 
  Mail, 
  ArrowUpRight, 
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { API_ROOT } from "@/config/api";

interface Leader {
  number: string;
  initials: string;
  role: string;
  name: string;
  affiliation: string;
  photo?: string;
  links: {
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

interface DynamicCoreMember {
  id: number;
  name: string;
  position: string;
  role: string;
  team: string;
  tag?: string;
  photo?: string;
  initials: string;
  github?: string;
  linkedin?: string;
  email?: string;
}

// Default fallback leaders in strict order: President -> Vice President -> Faculty Coordinator
const defaultLeaders: Leader[] = [
  {
    number: "01",
    initials: "SU",
    role: "PRESIDENT",
    name: "Saurabh Upadhyay",
    affiliation: "Executive Leadership",
    photo: "https://res.cloudinary.com/irc5e5we/image/upload/v1793356384/v4ncnpimxx49vklyrmyk.jpg",
    links: {
      linkedin: "#",
      email: "hello@saurabhupadhyay.com",
    },
  },
  {
    number: "02",
    initials: "MT",
    role: "VICE PRESIDENT",
    name: "Mayank Tiwari",
    affiliation: "Developer & Creator",
    photo: "https://res.cloudinary.com/irc5e5we/image/upload/v1787335826/aqlji2wctvkctctddcpx.png",
    links: {
      github: "https://github.com/neodyit",
      linkedin: "https://linkedin.com",
      email: "neodyinfotech@gmail.com",
    },
  },
  {
    number: "03",
    initials: "ND",
    role: "FACULTY COORDINATOR",
    name: "Neha Dhiman",
    affiliation: "Academic Mentor",
    photo: "https://www.codezencommunity.com/neha-dhiman.jpg",
    links: {
      linkedin: "#",
      email: "faculty@cgc.edu.in",
    },
  },
];

const defaultAvatarStack = [
  "/avatar-1.jpg",
  "/avatar-2.jpg",
  "/avatar-3.jpg",
  "/avatar-4.jpg",
];

const Leadership = () => {
  const [showAllLeads, setShowAllLeads] = useState(true);
  const [executiveLeaders, setExecutiveLeaders] = useState<Leader[]>(defaultLeaders);
  const [dynamicCoreTeam, setDynamicCoreTeam] = useState<DynamicCoreMember[]>([]);
  const [dynamicAvatars, setDynamicAvatars] = useState<string[]>(defaultAvatarStack);
  const [extraCount, setExtraCount] = useState<number>(99);

  useEffect(() => {
    // Dynamically fetch approved website leaders & core team from the backend
    fetch(`${API_ROOT}/leadership`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.leaders) && data.leaders.length > 0) {
            const mapped: Leader[] = data.leaders.map((u: any, idx: number) => {
              const num = String(idx + 1).padStart(2, "0");
              const names = (u.name || "").trim().split(" ");
              const initials =
                names.length >= 2
                  ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                  : (u.name || "LD").slice(0, 2).toUpperCase();

              return {
                number: num,
                initials: initials,
                role: (u.position || "EXECUTIVE LEAD").toUpperCase(),
                name: u.name,
                affiliation: u.tag || `${u.team || "Executive Board"} · CGC University`,
                photo: u.avatar || undefined,
                links: {
                  github: u.github || undefined,
                  linkedin: u.linkedin || undefined,
                  email: u.email || undefined,
                },
              };
            });
            setExecutiveLeaders(mapped);
          }

          if (Array.isArray(data.core_team)) {
            const mappedCore: DynamicCoreMember[] = data.core_team.map((u: any) => {
              const names = (u.name || "").trim().split(" ");
              const initials =
                names.length >= 2
                  ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                  : (u.name || "TM").slice(0, 2).toUpperCase();

              return {
                id: u.id,
                name: u.name,
                position: u.position || "Core Team",
                role: u.role || "Team",
                team: u.team || "Technical",
                tag: u.tag || u.bio || `${u.team || "Technical"} Lead`,
                photo: u.avatar || undefined,
                initials: initials,
                github: u.github || undefined,
                linkedin: u.linkedin || undefined,
                email: u.email || undefined,
              };
            });
            setDynamicCoreTeam(mappedCore);
          }

          if (Array.isArray(data.avatar_stack) && data.avatar_stack.length > 0) {
            setDynamicAvatars(data.avatar_stack.slice(0, 4));
          }

          if (typeof data.total_members_count === "number") {
            const extra = Math.max(0, data.total_members_count - 4);
            setExtraCount(extra > 0 ? extra : 10);
          }
        }
      })
      .catch(() => {
        // Fallback to defaults
      });
  }, []);

  return (
    <section className="relative w-full bg-white text-black font-sans py-24 md:py-32 px-6 sm:px-10 md:px-14 lg:px-20 overflow-hidden border-t border-black/10">
      {/* Subtle Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(#d4d4d8 1.1px, transparent 1.1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Minimal Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-20 gap-6 border-b border-black/10 pb-8">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-black/40 mb-3">
              — 03 — LEADERSHIP
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[0.92] text-black">
              Guiding Minds. <br />
              <span className="text-black/35">Shaping Builders.</span>
            </h2>
          </div>

          <p className="font-mono text-xs sm:text-sm text-black/50 uppercase tracking-widest max-w-xs">
            Faculty Mentorship & Executive Leadership · CGC University
          </p>
        </div>

        {/* Executive Leadership Cards with Photos (Order: President -> VP -> Faculty Coordinator) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {executiveLeaders.map((leader, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="h-full"
            >
              <div className="group relative h-full flex flex-col justify-between p-6 sm:p-7 bg-white border border-black/15 hover:border-black rounded-tl-[44px] rounded-br-[44px] rounded-tr-[14px] rounded-bl-[14px] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                
                <div>
                  {/* Photo Frame with matching Asymmetric Silhouette */}
                  <div className="relative w-full aspect-[4/4.4] sm:aspect-[4/4.2] rounded-tl-[36px] rounded-br-[36px] rounded-tr-[10px] rounded-bl-[10px] overflow-hidden bg-neutral-100 border border-black/10 group-hover:border-black transition-colors duration-500 mb-6">
                    {leader.photo ? (
                      <img
                        src={leader.photo}
                        alt={leader.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback-initials') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback Monogram Frame if image is not yet available */}
                    <div className={`fallback-initials w-full h-full ${leader.photo ? 'hidden' : 'flex'} flex-col items-center justify-center bg-neutral-100 text-black/40`}>
                      <span className="font-mono text-3xl font-black">{leader.initials}</span>
                      <span className="text-[10px] font-mono tracking-widest uppercase mt-1 text-black/30">Portrait</span>
                    </div>

                    {/* Floating Index Pill */}
                    <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-black/10 text-black font-mono text-xs font-bold shadow-sm">
                      {leader.number}
                    </div>
                  </div>

                  {/* Leader Info */}
                  <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-black/45 block mb-1.5">
                    {leader.role}
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-black mb-1.5 leading-tight">
                    {leader.name}
                  </h3>

                  <p className="text-xs font-mono text-black/55 tracking-wide">
                    {leader.affiliation}
                  </p>
                </div>

                {/* Bottom Row: Minimal Hairline Divider & Direct Links */}
                <div className="mt-8 pt-5 border-t border-black/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {leader.links.github && (
                      <a
                        href={leader.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-black/50 hover:text-black hover:border-black transition-colors"
                        title="GitHub"
                      >
                        <Github size={15} />
                      </a>
                    )}
                    {leader.links.linkedin && (
                      <a
                        href={leader.links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-black/50 hover:text-black hover:border-black transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin size={15} />
                      </a>
                    )}
                    {leader.links.email && (
                      <a
                        href={`mailto:${leader.links.email}`}
                        className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-black/50 hover:text-black hover:border-black transition-colors"
                        title="Email"
                      >
                        <Mail size={15} />
                      </a>
                    )}
                  </div>

                  <div className="w-9 h-9 rounded-full border border-black/10 group-hover:border-black group-hover:bg-black group-hover:text-white flex items-center justify-center text-black/40 transition-all duration-300">
                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

        {/* ============================================================== */}
        {/* DOMAIN LEADS & CORE TEAM SHOWCASE (WITH PHOTO CARDS)           */}
        {/* ============================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="mt-14 sm:mt-18 bg-neutral-950 text-white rounded-[40px] p-8 sm:p-10 md:p-12 border border-black/15 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Ambient Monochrome Grid Inside */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-white/10">
            {/* Left Content */}
            <div className="max-w-xl">
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase text-white/50 block mb-2">
                DOMAIN LEADS & CORE BOARD
              </span>
              <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2 leading-none">
                Our Core Team
              </h3>
              <p className="font-sans text-white/70 text-sm sm:text-base leading-relaxed">
                The Core Team Leads driving technology, operations, design, finance, and community outreach across CGC.
              </p>
            </div>

            {/* Right: Avatar Stack (Matching the exact uploaded design) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Overlapping Avatar Circles */}
              <div className="flex items-center">
                {dynamicAvatars.map((src, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3.5px] border-neutral-950 overflow-hidden shadow-xl -ml-4 first:ml-0 transition-transform duration-300 hover:scale-110 hover:z-20 relative bg-neutral-900"
                  >
                    <img
                      src={src}
                      alt={`Core Member ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = defaultAvatarStack[i % defaultAvatarStack.length];
                      }}
                    />
                  </div>
                ))}
                
                {/* Dynamic Count Badge */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3.5px] border-neutral-950 bg-white text-black flex items-center justify-center font-mono font-black text-sm sm:text-base shadow-xl -ml-4 z-10 transition-transform duration-300 hover:scale-110">
                  + {extraCount}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllLeads(!showAllLeads)}
                  className="group px-5 py-3 rounded-full border border-white/20 hover:border-white bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2"
                >
                  <span>{showAllLeads ? "Hide Leads" : "View Leads"}</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-300 ${showAllLeads ? "rotate-180" : ""}`}
                  />
                </button>

                <Link
                  to="/members"
                  className="group px-5 py-3 rounded-full bg-white text-black hover:bg-neutral-200 font-mono text-xs uppercase tracking-wider font-bold transition-colors flex items-center gap-2"
                >
                  <span>Members</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Dynamic Core Team Leads Grid with Photo Cards */}
          <AnimatePresence>
            {showAllLeads && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                {dynamicCoreTeam.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl my-6 bg-white/[0.02]">
                    <p className="text-white/60 font-mono text-xs uppercase tracking-wider">
                      No additional Core Team members highlighted on website yet.
                    </p>
                    <p className="text-white/30 font-mono text-[11px] mt-1">
                      Promote members and toggle "Show on Website" in Admin Panel to feature them here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-8">
                    {dynamicCoreTeam.map((member) => (
                      <div
                        key={member.id}
                        className="group p-4 sm:p-5 rounded-[28px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/35 transition-all duration-300 flex flex-col justify-between shadow-lg hover:-translate-y-1"
                      >
                        <div>
                          {/* Photo Container */}
                          <div className="relative w-full aspect-[4/4.5] rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-white/25 transition-colors mb-4">
                            {member.photo ? (
                              <img
                                src={member.photo}
                                alt={member.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.parentElement?.querySelector('.lead-fallback') as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}

                            {/* Fallback Monogram Frame */}
                            <div className={`lead-fallback w-full h-full ${member.photo ? 'hidden' : 'flex'} flex-col items-center justify-center bg-white/5 text-white/40`}>
                              <span className="font-mono text-2xl font-black">{member.initials}</span>
                            </div>

                            {/* Position Pill Floating on Photo */}
                            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-white font-mono text-[9px] font-bold uppercase tracking-wider">
                              {member.position}
                            </div>

                            {/* Team / Domain Pill Floating Top-Right */}
                            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[9px] font-mono text-white/80 uppercase">
                              {member.team}
                            </div>
                          </div>

                          {/* Member Details */}
                          <div className="px-1">
                            <h4 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug mb-1 group-hover:text-white transition-colors">
                              {member.name}
                            </h4>
                            <p className="text-[11px] font-mono text-white/50 leading-relaxed line-clamp-2">
                              {member.tag || `${member.team} Team`}
                            </p>
                          </div>
                        </div>

                        {/* Social Links if available */}
                        {(member.github || member.linkedin || member.email) && (
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                            {member.github && (
                              <a
                                href={member.github}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white text-white/70 hover:text-black flex items-center justify-center transition-colors"
                              >
                                <Github size={12} />
                              </a>
                            )}
                            {member.linkedin && (
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white text-white/70 hover:text-black flex items-center justify-center transition-colors"
                              >
                                <Linkedin size={12} />
                              </a>
                            )}
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white text-white/70 hover:text-black flex items-center justify-center transition-colors"
                              >
                                <Mail size={12} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Domain Tags Footer */}
          <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-white/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/80 font-bold uppercase">Domains:</span>
              <span>Technical</span>
              <span>·</span>
              <span>Management</span>
              <span>·</span>
              <span>Design</span>
              <span>·</span>
              <span>Marketing</span>
              <span>·</span>
              <span>Media</span>
              <span>·</span>
              <span>Operations</span>
            </div>

            <Link
              to="/members"
              className="text-white hover:underline flex items-center gap-1 font-bold tracking-wide"
            >
              <span>Explore All Members</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Leadership;
