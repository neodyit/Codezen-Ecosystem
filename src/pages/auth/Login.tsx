import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Key,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { auth } from "../../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { AUTH_API_URL, storeAuthSession } from "@/config/api";

type AuthFlowStage = "email_check" | "password_entry" | "forgot_password";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [flowStage, setFlowStage] = useState<AuthFlowStage>("email_check");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Step 1: Check Email
  const handleEmailCheck = async (e: React.FormEvent) => {
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
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setStatus("idle");

      if (data.exists) {
        setFlowStage("password_entry");
      } else {
        // Redirect directly to register with pre-filled email
        navigate(`/register?email=${encodeURIComponent(email.trim())}`);
      }
    } catch {
      setStatus("error");
      setErrorMessage("Could not connect to authentication server. Check your connection.");
    }
  };

  // Step 2: Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage("Please enter your account password");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (res.ok) {
        storeAuthSession(data.token, data.user);

        setStatus("success");
        setTimeout(() => {
          navigate(redirectTarget);
        }, 800);
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.message || "Invalid email or password");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Authentication failed. Please verify credentials.");
    }
  };

  // Forgot Password Trigger
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
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setSuccessMessage(data.message || "Password reset link sent to your email inbox.");
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.message || "Failed to dispatch reset email.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach auth server.");
    }
  };

  // Google OAuth Continue
  const handleGoogleContinue = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const res = await fetch(`${AUTH_API_URL}/google-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "User",
          google_id: user.uid,
          google_token: idToken,
          avatar: user.photoURL || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        storeAuthSession(data.token, data.user);

        setStatus("success");
        setTimeout(() => {
          if (data.requiresProfileCompletion) {
            navigate("/dashboard/profile?complete_profile=1");
          } else {
            navigate(redirectTarget);
          }
        }, 800);
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.message || "Google authentication failed");
      }
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Google authentication was cancelled or failed");
    }
  };

  return (
    <div className="bg-black text-white min-h-screen relative font-sans flex flex-col justify-between selection:bg-white selection:text-black">
      {/* Global Navigation Header */}
      <Navigation />

      {/* Subtle Dot Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-28 md:py-36">
        <div className="bg-zinc-950 border border-white/20 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          {/* Top Breadcrumb & Icon */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="group flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
              <span>HOME</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[10px] font-mono tracking-widest uppercase text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CODEZEN PORTAL</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mb-4">
              <Key size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2">
              {flowStage === "email_check"
                ? "SIGN IN TO CODEZEN"
                : flowStage === "password_entry"
                ? "ENTER YOUR PASSWORD"
                : "RESET PASSWORD"}
            </h1>
            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              {flowStage === "email_check"
                ? "Access your dashboard, manage event registrations, and view your developer credentials."
                : flowStage === "password_entry"
                ? `Account found for ${email}. Confirm password to continue.`
                : "Enter your registered email to receive a password reset link."}
            </p>
          </div>

          {/* STAGE 1: EMAIL CHECK */}
          {flowStage === "email_check" && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleEmailCheck}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="name@cgc.edu.in or personal email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                    }}
                    required
                    autoFocus
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white font-mono text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs text-rose-400 font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !email}
                className="w-full py-4 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group shadow-md disabled:opacity-50 mt-1"
              >
                <span>{status === "loading" ? "Verifying..." : "Continue with Email"}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  OR
                </span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogleContinue}
                disabled={status === "loading"}
                className="w-full py-3.5 px-4 rounded-2xl border border-white/20 hover:border-white bg-white/5 hover:bg-white/10 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </motion.form>
          )}

          {/* STAGE 2: PASSWORD ENTRY */}
          {flowStage === "password_entry" && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-4"
            >
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Account</span>
                  <span className="text-xs font-mono font-bold text-white">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFlowStage("email_check");
                    setPassword("");
                    setErrorMessage("");
                  }}
                  className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">
                  Account Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-4 text-zinc-500" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    required
                    autoFocus
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white font-mono text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs text-rose-400 font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {status === "success" && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>Credentials confirmed. Entering dashboard...</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setFlowStage("forgot_password");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-zinc-400 hover:text-white underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={status === "loading" || !password}
                className="w-full py-4 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group shadow-md disabled:opacity-50 mt-1"
              >
                <span>{status === "loading" ? "Verifying..." : "Enter Dashboard"}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.form>
          )}

          {/* STAGE 3: FORGOT PASSWORD */}
          {flowStage === "forgot_password" && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleForgotPassword}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">
                  Confirm Registered Email
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="name@cgc.edu.in"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                    }}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white font-mono text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-xs text-rose-400 font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group shadow-md disabled:opacity-50 mt-1"
              >
                <span>{status === "loading" ? "Dispatching..." : "Send Reset Link"}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFlowStage("password_entry");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-xs font-mono text-zinc-400 hover:text-white underline"
                >
                  Back to Password Login
                </button>
              </div>
            </motion.form>
          )}

          {/* Footer Toggle to Register */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs font-mono text-zinc-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-white font-bold underline hover:text-zinc-300">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Reassurance Footer */}
      <footer className="relative z-10 py-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs font-mono text-zinc-500">
        <ShieldCheck size={14} />
        <span>Greetings from Codezen</span>
      </footer>
    </div>
  );
}

