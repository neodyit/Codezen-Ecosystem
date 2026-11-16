import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { useRef, useState } from "react";

const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);
  const [hoveredLetter, setHoveredLetter] = useState<number | null>(null);

  const words = [
    { text: "MADE", letterIdx: 0 },
    { text: "BY", letterIdx: 1 },
    { text: "MAYANK", letterIdx: 3 },
    { text: "TIWARI", letterIdx: 5 },
  ];

  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });

  // Dynamically scrubs opacity & scale using scroll progression instead of transition
  const textScale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const textOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const footerEase = [0.22, 1, 0.36, 1] as [number, number, number, number];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: footerEase },
    },
  };

  return (
    <footer ref={footerRef} className="bg-black text-white font-sans pt-12 md:pt-20 border-t border-white h-screen flex flex-col">

      {/* Top Section: Info Grid */}
      <motion.div
        className="px-6 md:px-12 lg:px-16 max-w-[1600px] mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-y-10 md:gap-x-12 shrink-0"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Column 1: IDENTIFICATION */}
        <motion.div variants={itemVariants} className="flex flex-col gap-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-4 text-white/80">
            Identification
          </h3>
          <p className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide leading-relaxed">
            CodeZen
          </p>
          <p className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide leading-relaxed text-white/60">
            Student-Led Technology Community
          </p>
          <p className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide leading-relaxed text-white/60">
            CGC University
          </p>
        </motion.div>

        {/* Column 2: CHANNELS */}
        <motion.div variants={itemVariants} className="flex flex-col gap-1">
          <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-4 text-white/80">
            Channels
          </h3>
          <div className="flex flex-col gap-2">
            <a
              href="https://chat.whatsapp.com/GlNv1nsYpd49MivwcHkPCo?s=cl&p=a&ilr=1"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide hover:underline underline-offset-4 decoration-1 w-fit flex items-center gap-1"
            >
              WhatsApp ↗
            </a>
            <a
              href="https://www.linkedin.com/company/codezenofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide hover:underline underline-offset-4 decoration-1 w-fit flex items-center gap-1"
            >
              LinkedIn ↗
            </a>
            <a
              href="https://www.instagram.com/codezencommunity/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide hover:underline underline-offset-4 decoration-1 w-fit flex items-center gap-1"
            >
              Instagram ↗
            </a>
            <a
              href="mailto:info@codezencommunity.com"
              className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide hover:underline underline-offset-4 decoration-1 w-fit flex items-center gap-1"
            >
              Email ↗
            </a>
          </div>
        </motion.div>

        {/* Column 3: COLOPHON + YEAR */}
        <motion.div variants={itemVariants} className="flex flex-col h-full justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest mb-4 text-white/80">
              Colophon
            </h3>
            <p className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide text-white/60">
              Community: 2800+ Members / 60+ Core Team
            </p>
            <p className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide text-white/60">
              Domains: Technical / Management / Marketing / Design / Content / Media
            </p>
            <p className="font-sans text-xs md:text-sm font-medium uppercase tracking-wide text-white/60">
              Focus: Innovation / Collaboration / Real-World Learning
            </p>
          </div>

          <div className="mt-8 md:mt-0">
            <p className="font-sans text-xs md:text-sm font-bold uppercase tracking-widest text-white">
              2026
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Section: Branding Text */}
      <motion.div
        style={{ opacity: textOpacity, scale: textScale }}
        className="w-full flex-1 flex flex-col justify-center items-center overflow-hidden select-none pb-4"
      >
        {/* "MADE BY MAYANK TIWARI" positioned directly above CODEZEN */}
        <div className="flex items-center gap-3 md:gap-6 mb-2 md:mb-3">
          {words.map((w, idx) => {
            const isPushed = hoveredLetter !== null && (
              hoveredLetter === w.letterIdx ||
              (w.text === "MAYANK" && (hoveredLetter === 2 || hoveredLetter === 3)) ||
              (w.text === "TIWARI" && (hoveredLetter === 4 || hoveredLetter === 5 || hoveredLetter === 6))
            );

            return (
              <motion.span
                key={idx}
                animate={isPushed ? { y: -16, scale: 1.15, opacity: 1, color: "#ffffff" } : { y: 0, scale: 1, opacity: 0.5, color: "#a1a1aa" }}
                transition={{ type: "spring", stiffness: 450, damping: 15 }}
                className="font-mono text-[11px] md:text-sm uppercase tracking-[0.35em] inline-block font-semibold"
              >
                {w.text}
              </motion.span>
            );
          })}
        </div>

        <h1 className="font-sans font-black text-[23vw] leading-[0.8] text-white uppercase tracking-tighter flex items-start cursor-default">
          {"CODEZEN".split("").map((letter, i) => (
            <motion.span
              key={i}
              className="inline-block transition-colors duration-300 hover:text-white"
              onMouseEnter={() => setHoveredLetter(i)}
              onMouseLeave={() => setHoveredLetter(null)}
              whileHover={{
                y: -18,
                scale: 1.06,
                transition: { type: "spring", stiffness: 450, damping: 15 },
              }}
            >
              {letter}
            </motion.span>
          ))}
          <motion.span
            className="inline-block text-xl md:text-4xl lg:text-6xl font-medium mt-[2vw] ml-1 opacity-60 cursor-default"
            whileHover={{
              y: -10,
              rotate: 360,
              opacity: 1,
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
            }}
          >
            ®
          </motion.span>
        </h1>
      </motion.div>
    </footer>
  );
};

export default Footer;
