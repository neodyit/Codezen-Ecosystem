import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, X, Key, ArrowRight, ShieldCheck, CheckCircle2, UserPlus, AlertCircle, LayoutDashboard, LogOut } from "lucide-react";
import { auth } from "../../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { AUTH_API_URL } from "@/config/api";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type AuthStep = "idle" | "password" | "signup_prompt" | "forgot_password";

const perks = [
  {
    num: "01",
    title: "Hackathons & Sprints",
    desc: "Direct registration to collegiate hackathons, code sprints, and prize pools.",
  },
  {
    num: "02",
    title: "Bootcamps & Cohorts",
    desc: "Hands-on masterclasses in Full-Stack, AI/ML, Cloud, and Cybersecurity.",
  },
  {
    num: "03",
    title: "Workshops & Events",
    desc: "Collaborate on real-world projects, attend exclusive guest sessions, and get direct mentorship from industry experts.",
  },
];

const Contact = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [authStep, setAuthStep] = useState<AuthStep>("idle");

  // Prevent background scroll when auth modal is open
  useModalScrollLock(authStep !== "idle");

  // Track logged-in user state
  const [currentUser, setCurrentUser] = useState<{
    id?: number;
    name?: string;
    email?: string;
    role?: string;
    type?: string;
    team?: string;
    position?: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("codezen_token");
    const userJson = localStorage.getItem("codezen_user");
    if (token && userJson) {
      try {
        setCurrentUser(JSON.parse(userJson));
      } catch {
        setCurrentUser({ name: "Member" });
      }
    } else {
      setCurrentUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("codezen_token");
    localStorage.removeItem("codezen_user");
    setCurrentUser(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${AUTH_API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setSuccessMessage(data.message || "Password reset link sent to your email.");
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.message || "Failed to send reset email.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach auth server. Please try again.");
    }
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`${AUTH_API_URL}/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      
      setStatus("idle");
      
      if (data.exists) {
        setAuthStep("password");
      } else {
        setAuthStep("signup_prompt");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Could not connect to the auth server. Check your connection.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage("Please enter your password");
      return;
    }
    
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.token) localStorage.setItem("codezen_token", data.token);
        if (data.user) localStorage.setItem("codezen_user", JSON.stringify(data.user));

        setStatus("success");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.message || "Invalid credentials");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Login failed. Please try again.");
    }
  };

  const handleGoogleContinue = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const res = await fetch(`${AUTH_API_URL}/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "User",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) localStorage.setItem("codezen_token", data.token);
        if (data.user) localStorage.setItem("codezen_user", JSON.stringify(data.user));

        setStatus("success");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.message || "Google authentication failed");
      }
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to continue with Google");
    }
  };

  return (
    <>
      <section className="relative w-full min-h-screen bg-white text-black font-sans py-24 md:py-32 px-6 sm:px-10 md:px-14 lg:px-20 overflow-hidden flex items-center justify-center border-t border-black/10">
        {/* Subtle Dot Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: "radial-gradient(#d4d4d8 1.1px, transparent 1.1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Faint Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <span className="font-sans font-black text-[22vw] leading-none text-black/[0.03] tracking-tighter uppercase whitespace-nowrap">
            JOIN
          </span>
        </div>

        <div className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Editorial Invitation & Community Perks     */}
          {/* ======================================================== */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 flex flex-col justify-between"
          >
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-black/45 mb-4">
                <span>— 04 — MEMBERSHIP & ACCESS</span>
              </div>

              {/* Stacked Headline */}
              <h1 className="font-sans font-black uppercase text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.2rem] leading-[0.88] tracking-tighter text-black select-none mb-6">
                <span className="block text-black">BECOME A</span>
                <span className="block text-black/35">BUILDER.</span>
              </h1>

              {/* Subtitle */}
              <p className="font-sans text-neutral-600 text-base sm:text-lg max-w-lg leading-relaxed mb-10">
                Join 2800+ student developers, creators, and managers at Codezen. Access exclusive hackathons, industry bootcamps, and build real-world products.
              </p>
            </div>

            {/* Structured Member Perks List */}
            <div className="flex flex-col border-t border-black/10 pt-6">
              {perks.map((perk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-5 py-4 border-b border-black/10 group"
                >
                  <span className="font-mono text-xs font-bold text-black/40 group-hover:text-black transition-colors pt-0.5">
                    {perk.num}
                  </span>
                  <div>
                    <h4 className="font-sans font-black text-sm uppercase tracking-wider text-black">
                      {perk.title}
                    </h4>
                    <p className="font-sans text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      {perk.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2.5 mt-8 text-xs font-mono text-black/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Open to all CGC University students · Free community access</span>
            </div>
          </motion.div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Premium Architectural Auth Card           */}
          {/* ======================================================== */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <div className="p-8 sm:p-10 rounded-[38px] bg-neutral-950 text-white border border-black/20 shadow-2xl relative overflow-hidden">
              
              {currentUser ? (
                /* ======================================================== */
                /* LOGGED IN STATE CARD                                    */
                /* ======================================================== */
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>SESSION ACTIVE</span>
                      </span>

                      <span className="text-[10px] font-mono tracking-widest uppercase text-white/40">
                        {currentUser.role || "Member"}
                      </span>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center font-mono font-black text-2xl mb-5 shadow-lg">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                      WELCOME BACK, <br />
                      <span className="text-zinc-400">{currentUser.name || "Member"}</span>
                    </h3>

                    <p className="text-xs font-mono text-white/50 mt-2 leading-relaxed">
                      You are currently authenticated as <span className="text-white font-bold">{currentUser.email}</span>.
                    </p>

                    {/* Meta info badge row */}
                    <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 font-mono text-xs text-white/70">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 uppercase text-[10px]">Portal Role</span>
                        <span className="text-white font-semibold">{currentUser.role || "Community Member"}</span>
                      </div>
                      {currentUser.team && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                          <span className="text-white/40 uppercase text-[10px]">Team Wing</span>
                          <span className="text-white">{currentUser.team}</span>
                        </div>
                      )}
                      {currentUser.position && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                          <span className="text-white/40 uppercase text-[10px]">Position</span>
                          <span className="text-white">{currentUser.position}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Go to Dashboard or Logout */}
                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="flex-1 py-4 px-6 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-md group"
                    >
                      <LayoutDashboard size={15} />
                      <span>Dashboard</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={handleLogout}
                      className="py-4 px-5 rounded-2xl border border-white/20 hover:border-white font-mono text-xs uppercase tracking-wider text-white/70 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut size={14} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ======================================================== */
                /* GUEST / LOGGED OUT STATE (ORIGINAL CARD)                 */
                /* ======================================================== */
                <>
                  {/* Card Header */}
                  <div className="mb-8">
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border border-white/20 text-white bg-white/10 inline-block mb-3">
                      AUTHENTICATION PORTAL
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                      Join CodeZen
                    </h3>
                    <p className="text-xs font-mono text-white/50 mt-1">
                      Enter your email or continue with Google to access events & updates.
                    </p>
                  </div>

                  {/* 1-Click Google Auth */}
                  <button
                    type="button"
                    onClick={handleGoogleContinue}
                    disabled={status === "loading" || authStep !== "idle"}
                    className="w-full py-4 px-6 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all shadow-md group disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.6 3.6 1.8 7.3l3.7 2.9C6.4 7.2 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.5 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.8 7.3C.7 9.5 0 12 0 14.5s.7 5 1.8 7.2l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.6-2.1-6.5-5.1L1.8 16.6C3.6 20.4 7.4 23.5 12 23.5z"
                      />
                    </svg>
                    <span>{status === "loading" && authStep === "idle" ? "Connecting..." : "Continue with Google"}</span>
                  </button>

                  {/* Divider */}
                  <div className="relative my-6 flex items-center justify-center">
                    <div className="w-full h-px bg-white/10" />
                    <span className="absolute px-3 bg-neutral-950 font-mono text-[10px] font-bold uppercase tracking-widest text-white/40">
                      OR EMAIL
                    </span>
                  </div>

                  {/* Email Form */}
                  <form onSubmit={handleEmailContinue} className="flex flex-col gap-4">
                    <div className="relative flex items-center">
                      <Mail size={18} className="absolute left-4 text-white/40 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="Enter your student email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage("");
                        }}
                        disabled={status === "loading" || authStep !== "idle"}
                        className="w-full py-4 pl-12 pr-4 rounded-2xl bg-white/[0.07] border border-white/15 focus:border-white focus:bg-white/10 text-white placeholder:text-white/35 font-mono text-xs outline-none transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === "loading" || authStep !== "idle"}
                      className="w-full py-4 px-6 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all group disabled:opacity-50"
                    >
                      <span>{status === "loading" && authStep === "idle" ? "Checking..." : "Proceed with Email"}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>

                  {/* Status / Error Notifications */}
                  {errorMessage && authStep === "idle" && (
                    <p className="text-xs text-rose-400 font-mono mt-4 text-center">
                      {errorMessage}
                    </p>
                  )}

                  {status === "success" && authStep === "idle" && (
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono mt-4">
                      <CheckCircle2 size={14} />
                      <span>Authenticated successfully! Redirecting...</span>
                    </div>
                  )}

                  {/* Assurance Footnote */}
                  <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-[10px] font-mono text-white/40">
                    <ShieldCheck size={13} />
                    <span>Secure student authentication · No spam</span>
                  </div>
                </>
              )}

            </div>
          </motion.div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* AUTHENTICATION MODALS (OTP, PASSWORD, SIGNUP)            */}
      {/* ======================================================== */}
      <AnimatePresence>
        {authStep !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25 }}
              data-lenis-prevent
              className="bg-white text-black p-8 sm:p-10 rounded-[36px] w-full max-w-md shadow-2xl relative border border-black/10 max-h-[90vh] overflow-y-auto overscroll-contain"
            >
              {/* Close Button */}
              <button 
                onClick={() => {
                  setAuthStep("idle");
                  setStatus("idle");
                  setErrorMessage("");
                }}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
              >
                <X size={18} />
              </button>

              {/* CASE 1: EXISTING USER FOUND -> ENTER PASSWORD TO ACCESS DASHBOARD */}
              {authStep === "password" && (
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-5">
                    <Key size={22} />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 bg-black/5 text-[10px] font-mono uppercase tracking-widest text-black/60 w-fit mb-3">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>Account Detected</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-1">
                    We found an account with this email
                  </h3>
                  <p className="text-xs font-mono text-black/60 mb-6 leading-relaxed">
                    Account: <span className="font-bold text-black">{email}</span>. Enter your password and enter dashboard.
                  </p>
                  
                  <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        placeholder="Enter your account password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrorMessage("");
                        }}
                        className="w-full py-4 px-4 rounded-2xl bg-neutral-100 border border-black/10 focus:border-black font-mono text-sm outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                    
                    {errorMessage && (
                      <div className="flex items-center gap-2 text-xs text-rose-500 font-mono">
                        <AlertCircle size={14} />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {status === "success" && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-mono">
                        <CheckCircle2 size={14} />
                        <span>Credentials confirmed. Redirecting to dashboard...</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-1 mb-2">
                      <span className="text-[10px] font-mono text-black/50">Password required</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep("forgot_password");
                          setErrorMessage("");
                          setSuccessMessage("");
                        }}
                        className="text-xs font-mono font-bold text-black underline hover:text-black/70"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={status === "loading" || !password}
                      className="group flex items-center justify-center gap-2 w-full bg-black text-white py-4 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider hover:bg-black/85 transition-colors disabled:opacity-50 mt-1"
                    >
                      <span>{status === "loading" ? "Verifying..." : "Enter Dashboard"}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </div>
              )}

              {/* CASE 1B: FORGOT PASSWORD MODAL */}
              {authStep === "forgot_password" && (
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-5">
                    <Key size={22} />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 bg-black/5 text-[10px] font-mono uppercase tracking-widest text-black/60 w-fit mb-3">
                    <span>Account Recovery</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-1">
                    Forgot Password
                  </h3>
                  <p className="text-xs font-mono text-black/60 mb-6 leading-relaxed">
                    We will send an expiry-based secure password reset link to <span className="font-bold text-black">{email}</span>.
                  </p>

                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        placeholder="Confirm your email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage("");
                          setSuccessMessage("");
                        }}
                        required
                        className="w-full py-4 px-4 rounded-2xl bg-neutral-100 border border-black/10 focus:border-black font-mono text-sm outline-none transition-colors"
                      />
                    </div>

                    {errorMessage && (
                      <div className="flex items-center gap-2 text-xs text-rose-500 font-mono">
                        <AlertCircle size={14} />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 font-mono">
                        <CheckCircle2 size={14} />
                        <span>{successMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="group flex items-center justify-center gap-2 w-full bg-black text-white py-4 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider hover:bg-black/85 transition-colors disabled:opacity-50 mt-2"
                    >
                      <span>{status === "loading" ? "Dispatching..." : "Send Reset Link"}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="mt-4 pt-4 border-t border-black/10 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep("password");
                          setErrorMessage("");
                          setSuccessMessage("");
                        }}
                        className="text-xs font-mono text-black/60 hover:text-black underline"
                      >
                        Back to Password Login
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* CASE 2: ACCOUNT NOT AVAILABLE -> PROMPT TO CREATE NEW ACCOUNT */}
              {authStep === "signup_prompt" && (
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-5">
                    <UserPlus size={22} />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 bg-black/5 text-[10px] font-mono uppercase tracking-widest text-black/60 w-fit mb-3">
                    <span>New Membership</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
                    Want to Create new account with this email?
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-neutral-100 border border-black/10 mb-6">
                    <p className="text-xs font-mono text-black/50">Target Email</p>
                    <p className="text-sm font-mono font-bold text-black break-all">{email}</p>
                  </div>

                  <Link
                    to={`/register?email=${encodeURIComponent(email)}`}
                    className="w-full py-4 px-6 rounded-2xl bg-black text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all group shadow-md"
                  >
                    <span>Create an Account</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <div className="mt-6 pt-5 border-t border-black/10 text-center">
                    <p className="text-xs font-mono text-black/50">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthStep("password");
                          setErrorMessage("");
                        }}
                        className="text-black font-bold underline hover:text-black/80"
                      >
                        Login
                      </button>
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Contact;
