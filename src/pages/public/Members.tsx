"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, IconContainer } from "@/components/ui/radar-effect";
import Navigation from "@/components/Navigation";
import {
  Code,
  Terminal,
  Server,
  Cpu,
  Shield,
  Brain,
  Figma,
  Palette,
  Box,
  Layers,
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  Megaphone,
  Share2,
  PenTool,
  Video
} from "lucide-react";

type DomainKey = "Technical" | "Design" | "Management" | "Marketing";

interface Member {
  name: string;
  role: string;
  icon: React.ReactNode;
}

const DOMAINS: Record<DomainKey, { description: string; members: Member[] }> = {
  Technical: {
    description: "The builders, developers, and architects crafting Codezen's digital ecosystem.",
    members: [
      { name: "Mayank Tiwari", role: "President & Founder", icon: <Terminal className="h-7 w-7 text-sky-400" /> },
      { name: "Pranav Gupta", role: "Tech Lead", icon: <Code className="h-7 w-7 text-sky-400" /> },
      { name: "Aditya Vardhan", role: "Backend Architect", icon: <Server className="h-7 w-7 text-sky-400" /> },
      { name: "Sneha Sharma", role: "Frontend Developer", icon: <Cpu className="h-7 w-7 text-sky-400" /> },
      { name: "Rishabh Dev", role: "Cybersecurity Lead", icon: <Shield className="h-7 w-7 text-sky-400" /> },
      { name: "Aniket Sen", role: "AI/ML Lead", icon: <Brain className="h-7 w-7 text-sky-400" /> },
    ]
  },
  Design: {
    description: "The visual storytellers shaping Codezen's UI/UX, graphics, and brand identity.",
    members: [
      { name: "Diya Roy", role: "UI/UX Lead", icon: <Figma className="h-7 w-7 text-pink-400" /> },
      { name: "Aryan Varma", role: "Creative Director", icon: <Palette className="h-7 w-7 text-pink-400" /> },
      { name: "Kunal Kashyap", role: "3D Visualizer", icon: <Box className="h-7 w-7 text-pink-400" /> },
      { name: "Simran Kaur", role: "Brand Designer", icon: <Layers className="h-7 w-7 text-pink-400" /> },
    ]
  },
  Management: {
    description: "The coordinators making events, partnerships, and operations execute flawlessly.",
    members: [
      { name: "Tushar Singla", role: "Operations Lead", icon: <Briefcase className="h-7 w-7 text-emerald-400" /> },
      { name: "Nancy Joshi", role: "Public Relations", icon: <Users className="h-7 w-7 text-emerald-400" /> },
      { name: "Rohit Bansal", role: "Event Coordinator", icon: <Calendar className="h-7 w-7 text-emerald-400" /> },
      { name: "Sakshi Arora", role: "Logistics Manager", icon: <TrendingUp className="h-7 w-7 text-emerald-400" /> },
    ]
  },
  Marketing: {
    description: "The growth drivers expanding Codezen's outreach, content strategy, and presence.",
    members: [
      { name: "Raghav Mehra", role: "Marketing Lead", icon: <Megaphone className="h-7 w-7 text-amber-400" /> },
      { name: "Esha Dutt", role: "Social Media Manager", icon: <Share2 className="h-7 w-7 text-amber-400" /> },
      { name: "Karan Johar", role: "Content Strategist", icon: <PenTool className="h-7 w-7 text-amber-400" /> },
      { name: "Ahana Sen", role: "Media Head", icon: <Video className="h-7 w-7 text-amber-400" /> },
    ]
  }
};

const getRowLayout = (members: Member[]) => {
  if (members.length === 6) {
    return {
      row1: [members[0], members[1], members[2]],
      row2: [members[3], members[4]],
      row3: [members[5], null]
    };
  } else if (members.length === 4) {
    return {
      row1: [members[0], null, members[1]],
      row2: [members[2], members[3]],
      row3: [null, null]
    };
  } else {
    return {
      row1: [members[0], members[1], members[2]].map(m => m || null),
      row2: [members[3], members[4]].map(m => m || null),
      row3: [members[5], members[6]].map(m => m || null)
    };
  }
};

export default function Members() {
  const [selectedDomain, setSelectedDomain] = useState<DomainKey>("Technical");

  const currentDomain = DOMAINS[selectedDomain];
  const layout = getRowLayout(currentDomain.members);

  const renderMember = (member: Member | null, idx: number) => {
    if (!member) {
      // Return a hidden placeholder to preserve flex layout spacing
      return <div className="w-12 md:w-32 h-16 opacity-0 pointer-events-none" />;
    }

    return (
      <IconContainer
        delay={idx * 0.08}
        icon={member.icon}
        text={
          <div className="text-center pointer-events-auto group cursor-default">
            {/* Member Name */}
            <div className="text-xs md:text-sm font-black text-slate-100 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
              {member.name}
            </div>
            {/* Member Role */}
            <div className="text-[10px] md:text-xs font-mono font-medium text-slate-500 group-hover:text-slate-400 transition-colors duration-200 mt-0.5 whitespace-nowrap">
              {member.role}
            </div>
            
            {/* Glowing Active Status dot on the radar */}
            <div className="flex items-center justify-center gap-1 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400" />
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                Active
              </span>
            </div>
          </div>
        }
      />
    );
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative font-sans overflow-hidden flex flex-col">
      {/* Brand Logo */}
      <div className="fixed top-6 left-6 md:top-8 md:left-10 z-50 mix-blend-difference">
        <Link to="/">
          <h1 className="font-sans font-black text-2xl md:text-4xl tracking-tighter text-white flex items-start">
            CODEZEN
            <span className="text-xs md:text-lg font-medium ml-1 -mt-1 md:-mt-2">Club</span>
          </h1>
        </Link>
      </div>

      <Navigation />

      {/* Grid Overlay for premium look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-between z-10 pt-28 pb-12 px-6 relative w-full max-w-7xl mx-auto">
        
        {/* Header / Intro */}
        <div className="text-center max-w-3xl space-y-4 mb-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight"
          >
            Club Members
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto"
          >
            {currentDomain.description}
          </motion.p>

          {/* Domain Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {(Object.keys(DOMAINS) as DomainKey[]).map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-4 py-2 text-xs md:text-sm font-black uppercase tracking-widest border transition-all duration-300 ${
                  selectedDomain === domain
                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    : "bg-transparent text-white/60 border-white/20 hover:border-white/50 hover:text-white"
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Radar & Members Screen */}
        <div className="relative flex h-[480px] w-full max-w-3xl flex-col items-center justify-center space-y-6 overflow-hidden px-4 md:px-12 border border-slate-800/40 rounded-3xl bg-black/40 backdrop-blur-sm mt-4 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDomain}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col space-y-6 items-center justify-center"
            >
              {/* Row 1 */}
              <div className="mx-auto w-full max-w-3xl z-50">
                <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
                  {renderMember(layout.row1[0], 0)}
                  {renderMember(layout.row1[1], 1)}
                  {renderMember(layout.row1[2], 2)}
                </div>
              </div>

              {/* Row 2 */}
              <div className="mx-auto w-full max-w-md z-50">
                <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
                  {renderMember(layout.row2[0], 3)}
                  {renderMember(layout.row2[1], 4)}
                </div>
              </div>

              {/* Row 3 */}
              <div className="mx-auto w-full max-w-3xl z-50">
                <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
                  {renderMember(layout.row3[0], 5)}
                  {renderMember(layout.row3[1], 6)}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <Radar className="absolute -bottom-10 left-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 z-[41] h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>

        {/* Footer info / Back button */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
