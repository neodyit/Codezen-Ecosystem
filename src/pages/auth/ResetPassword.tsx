import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft, AlertCircle, Key, Lock } from "lucide-react";
import Navigation from "@/components/Navigation";
import { AUTH_API_URL, storeAuthSession } from "@/config/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setErrorMessage("Invalid or missing password reset token. Please request a new link.");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      setErrorMessage("Missing reset token or email.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`${AUTH_API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        storeAuthSession(data.token, data.user);

        setStatus("success");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        setStatus("error");
        setErrorMessage(data.error || data.message || "Failed to reset password.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error connecting to auth server.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-between selection:bg-white selection:text-black relative">
      <Navigation />

      {/* Background Dot Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1.1px, transparent 1.1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top Bar */}
      <div className="relative z-10 px-6 sm:px-12 py-6 flex items-center justify-between border-b border-white/10">
        <Link
          to="/#contact"
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Ecosystem</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">Credential Recovery</span>
        </div>
      </div>

      {/* Main card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-[38px] bg-neutral-950 border border-white/10 shadow-2xl relative">
          
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mb-5">
            <Key size={22} />
          </div>

          <div className="mb-6">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border border-white/20 text-white bg-white/10 inline-block mb-3">
              SECURITY VERIFIED
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white">
              Set New Password
            </h2>
            <p className="text-xs font-mono text-white/50 mt-1">
              Resetting password for <span className="text-white font-bold">{email || "your account"}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                <Lock size={12} />
                <span>New Password</span>
              </label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                required
                className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                <Lock size={12} />
                <span>Confirm New Password</span>
              </label>
              <input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
                required
                className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-rose-400 font-mono mt-1">
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mt-1">
                <CheckCircle2 size={14} />
                <span>Password reset successful! Redirecting to dashboard...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !password || !confirmPassword || !token}
              className="w-full py-4 px-6 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all group disabled:opacity-50 mt-2 shadow-md"
            >
              <span>{status === "loading" ? "Updating Password..." : "Update Password & Enter"}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link to="/#contact" className="text-xs font-mono text-white/50 hover:text-white underline">
              Return to Login
            </Link>
          </div>

        </div>
      </div>

      <div className="relative z-10 py-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs font-mono text-white/40">
        <ShieldCheck size={14} />
        <span>End-to-end encrypted student authentication · CodeZen Security</span>
      </div>
    </div>
  );
};

export default ResetPassword;
