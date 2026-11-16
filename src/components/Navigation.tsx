import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { logoutUser, getStoredToken, getStoredUser } from "@/config/api";

interface NavItem {
  label: string;
  href: string;
  number: string;
  isExternalOrHash?: boolean;
}

interface SocialItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", number: "01", isExternalOrHash: false },
  { label: "Events", href: "/events", number: "02", isExternalOrHash: false },
  { label: "Members", href: "/members", number: "03", isExternalOrHash: false },
  { label: "Store", href: "/store", number: "04", isExternalOrHash: false },
];

const socialItems: SocialItem[] = [
  { label: "WhatsApp", href: "https://chat.whatsapp.com/GlNv1nsYpd49MivwcHkPCo?s=cl&p=a&ilr=1" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/codezenofficial" },
  { label: "Instagram", href: "https://www.instagram.com/codezencommunity/" },
  { label: "Email", href: "mailto:info@codezencommunity.com" },
];

const ease = [0.76, 0, 0.24, 1] as [number, number, number, number];
const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

const overlayVariants: Variants = {
  closed: {
    clipPath: "inset(0% 0% 100% 0%)",
    transition: { duration: 1.0, ease },
  },
  open: {
    clipPath: "inset(0% 0% 0% 0%)",
    transition: { duration: 1.0, ease },
  },
};

const itemVariants: Variants = {
  closed: {
    y: 40,
    opacity: 0,
    transition: { duration: 0.8, ease },
  },
  open: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 1.0,
      delay: 0.4 + i * 0.1,
      ease: easeOut,
    },
  }),
};

const socialVariants: Variants = {
  closed: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.6, ease },
  },
  open: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.6 + i * 0.08,
      ease: "easeOut",
    },
  }),
};

const Navigation = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = getStoredUser();
      const token = getStoredToken();
      if (token && storedUser) {
        setUser(storedUser);
      } else if (token) {
        setUser({ name: "Member" });
      } else {
        setUser(null);
      }
    };

    checkAuth();

    // Listen for global auth invalidation events
    window.addEventListener("codezen_auth_invalidated", checkAuth);
    return () => {
      window.removeEventListener("codezen_auth_invalidated", checkAuth);
    };
  }, [open]);

  const handleLogout = async () => {
    setUser(null);
    setOpen(false);
    await logoutUser("/#contact");
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none"; // Critical for iOS Safari
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [open]);

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <div
        className="fixed top-6 right-6 md:top-8 md:right-10 z-[200]"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-col items-center justify-center gap-[5px] w-14 h-14 md:w-16 md:h-16 rounded-full bg-black transition-colors duration-300 relative"
          style={{
            boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.6)",
            WebkitFontSmoothing: "antialiased",
          }}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {/* Top Line */}
          <motion.span
            animate={open ? { rotate: 45, y: 6.5, scaleX: 0.8 } : { rotate: 0, y: 0, scaleX: 1 }}
            transition={{ duration: 0.6, ease }}
            className="absolute block h-[1.5px] w-[22px] bg-white origin-center"
            style={{ top: "35%" }}
          />
          {/* Middle Line */}
          <motion.span
            animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.4, ease }}
            className="absolute block h-[1.5px] w-[22px] bg-white origin-center"
            style={{ top: "50%", marginTop: "-0.75px" }}
          />
          {/* Bottom Line */}
          <motion.span
            animate={open ? { rotate: -45, y: -6.5, scaleX: 0.8 } : { rotate: 0, y: 0, scaleX: 1 }}
            transition={{ duration: 0.6, ease }}
            className="absolute block h-[1.5px] w-[22px] bg-white origin-center"
            style={{ bottom: "35%" }}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-[100] bg-black flex flex-col justify-between px-8 md:px-16 pt-16 pb-10 md:pt-20 md:pb-14"
          >
            {/* Socials & Auth Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-y-4 mb-4 pt-12 md:pt-4 pr-16 md:pr-24 border-b border-white/10 pb-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <p className="text-base md:text-lg font-medium text-white/50 uppercase tracking-wider mr-2 select-none">
                  Socials
                </p>
                {socialItems.map((item, i) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    custom={i}
                    variants={socialVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="text-base md:text-lg font-medium text-white hover:opacity-40"
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>

              {/* Dynamic Auth Header: Name, Dashboard, Logout (or Login) */}
              <div className="flex items-center gap-3 md:gap-4">
                {user ? (
                  <>
                    <span className="text-xs md:text-sm font-mono font-bold tracking-wider text-white px-3 py-1.5 rounded-full border border-white/20 bg-white/5">
                      {user.name || "Member"}
                    </span>
                    <Link
                      to="/dashboard"
                      onClick={handleNavClick}
                      className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-xs md:text-sm font-mono uppercase tracking-wider text-white/60 hover:text-white px-3 py-1.5 rounded-full border border-white/20 hover:border-white transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={handleNavClick}
                    className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-white/30 text-white hover:bg-white hover:text-black transition-all"
                  >
                    Login / Join
                  </Link>
                )}
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col gap-0">
              {navItems.map((item, i) => {
                const linkContent = (
                  <>
                    <span className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white uppercase tracking-tight leading-none group-hover:translate-x-3 transition-transform duration-300 ease-out">
                      {item.label}
                    </span>
                    <span className="text-xs text-white/55 font-mono tracking-widest self-start mt-2">
                      {item.number}
                    </span>
                  </>
                );

                return (
                  <div
                    key={item.label}
                    className="overflow-hidden border-b border-white/25 py-3 md:py-4"
                  >
                    {item.isExternalOrHash ? (
                      <motion.a
                        href={item.href}
                        onClick={handleNavClick}
                        custom={i}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="flex items-baseline justify-between group cursor-pointer"
                      >
                        {linkContent}
                      </motion.a>
                    ) : (
                      <motion.div
                        custom={i}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                      >
                        <Link
                          to={item.href}
                          onClick={handleNavClick}
                          className="flex items-baseline justify-between group cursor-pointer"
                        >
                          {linkContent}
                        </Link>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Bottom copyright */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1.2, duration: 0.8 } }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              className="text-xs text-white/30 font-mono tracking-widest mt-8 md:mt-0 md:self-end"
            >
              Built by Mayank Tiwari
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;