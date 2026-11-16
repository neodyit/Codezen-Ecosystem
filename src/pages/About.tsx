import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const stats = [
  { value: "2100+", label: "COMMUNITY MEMBERS" },
  { value: "60+", label: "CORE TEAM" },
  { value: "1800+", label: "EVENT REGISTRATIONS" },
  { value: "5+", label: "MAJOR EVENTS" },
];

const About = () => {
  const [vh, setVh] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );

  useEffect(() => {
    const updateVh = () => setVh(window.innerHeight);
    updateVh();
    window.addEventListener("resize", updateVh);
    return () => window.removeEventListener("resize", updateVh);
  }, []);

  const { scrollY } = useScroll();

  // Scroll animations for smooth parallax reveal
  const leftY = useTransform(scrollY, [0, vh * 0.4], [70, 0]);
  const leftOpacity = useTransform(scrollY, [0, vh * 0.3], [0, 1]);

  const rightY = useTransform(scrollY, [vh * 0.1, vh * 0.5], [70, 0]);
  const rightOpacity = useTransform(scrollY, [vh * 0.1, vh * 0.4], [0, 1]);

  return (
    <section className="relative w-full h-screen bg-white text-black font-sans overflow-hidden flex items-center justify-center px-6 sm:px-10 md:px-14 lg:px-20 xl:px-28">
      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#d4d4d8 1.1px, transparent 1.1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Large Faint Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <span className="font-sans font-black text-[18vw] leading-none text-neutral-900/[0.035] tracking-tighter uppercase whitespace-nowrap">
          CODEZEN
        </span>
      </div>

      {/* Main Two-Column Content Grid */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-24 items-center">
        {/* Left Column: WHAT WE ARE */}
        <motion.div
          style={{ y: leftY, opacity: leftOpacity }}
          className="lg:col-span-6 flex flex-col justify-center"
        >
          {/* Eyebrow Label */}
          <p className="text-[11px] sm:text-xs font-mono font-medium tracking-[0.25em] text-neutral-400 uppercase mb-5 sm:mb-8">
            — 01 — WHAT WE ARE
          </p>

          {/* Main Title */}
          <h2 className="font-sans font-black tracking-tighter text-5xl sm:text-6xl md:text-7xl lg:text-[5.2rem] xl:text-[6.2rem] leading-[0.88] uppercase select-none">
            <span className="block text-black">BUILDING</span>
            <span className="block text-slate-500">ELITE</span>
            <span className="block text-black">DEVELOPERS.</span>
          </h2>

          {/* Description */}
          <p className="font-sans text-neutral-500 text-sm sm:text-base md:text-[15px] leading-relaxed max-w-lg mt-6 sm:mt-8 font-normal">
            CGC University's premier student-led technology community, engineering high-performance contributors, software leads, and technical founders through structured learning and real-world building.
          </p>

          {/* Bottom Divider / Tagline */}
          <div className="flex items-center gap-3 mt-8 sm:mt-10 text-[10px] sm:text-xs font-mono font-medium tracking-[0.25em] text-neutral-400 uppercase">
            <span className="w-8 sm:w-12 h-[1px] bg-neutral-300" />
            <span className="whitespace-nowrap">BUILD · DEVELOP · GROW</span>
            <span className="flex-1 max-w-[180px] sm:max-w-[260px] h-[1px] bg-neutral-300" />
          </div>
        </motion.div>

        {/* Right Column: BY THE NUMBERS */}
        <motion.div
          style={{ y: rightY, opacity: rightOpacity }}
          className="lg:col-span-6 flex flex-col justify-center lg:pl-4 xl:pl-8"
        >
          {/* Eyebrow Label */}
          <p className="text-[11px] sm:text-xs font-mono font-medium tracking-[0.25em] text-neutral-400 uppercase mb-4 sm:mb-6">
            — 02 — BY THE NUMBERS
          </p>

          {/* Stats List */}
          <div className="flex flex-col w-full">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-5 sm:py-6 md:py-7 border-b border-neutral-200/90"
              >
                <span className="font-sans font-black text-4xl sm:text-5xl md:text-6xl text-neutral-900 tracking-tight leading-none">
                  {stat.value}
                </span>
                <span className="font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium text-right ml-4">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
