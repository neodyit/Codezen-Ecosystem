import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Chrome } from "lucide-react";

const Contact = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your email");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // Handle email authentication here
      // This could be Firebase sign-in, sending magic link, etc.
      console.log("Proceed using email:", email);
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  const handleGoogleContinue = async () => {
    setStatus("loading");
    setErrorMessage("");

    try {
      // Handle Google authentication here
      // This could be Firebase Google sign-in
      console.log("Continue with Google");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setErrorMessage("Google sign-in failed. Please try again.");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  return (
    <section className="h-screen w-full bg-white text-black font-sans px-4 md:px-8 lg:px-12 overflow-hidden flex items-center justify-center relative">
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-12 gap-y-8 lg:gap-x-16 max-w-[1400px] w-full mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full py-2">
          <motion.div variants={itemVariants} className="mb-8 lg:mb-0">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tight text-left">
              Join <br />
              CodeZen <span className="inline-block ml-2">-&gt;</span>
            </h1>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 lg:mt-0 hidden lg:block">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-black/60">
              Join CodeZen
            </h2>
            <p className="text-base md:text-lg font-normal leading-relaxed text-black/80 max-w-md text-left">
              Sign in to join CodeZen, explore events, and connect with the student-led community.
            </p>
          </motion.div>
        </div>

        {/* Right Column: Authentication Methods */}
        <motion.div className="lg:col-span-5 flex flex-col justify-center gap-6" variants={itemVariants}>
          {/* Continue with Email */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-widest text-black/60">
              Continue with Email
            </label>
            <form onSubmit={handleEmailContinue} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                className="w-full bg-transparent border-b border-black/30 py-3 text-lg font-medium placeholder:text-black/40 focus:border-black focus:outline-none transition-colors"
                disabled={status === "loading"}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="group flex items-center gap-3 text-lg font-bold uppercase tracking-wider hover:text-black/70 transition-colors disabled:opacity-50 w-fit"
              >
                <Mail size={20} />
                {status === "loading" ? "Signing in..." : "Continue with Email"}
                <span className="group-hover:translate-x-2 transition-transform duration-300">-&gt;</span>
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative h-px bg-black/10 my-2">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-bold uppercase tracking-widest text-black/40">
              or
            </span>
          </div>

          {/* Continue with Google */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-widest text-black/60">
              Continue with Google
            </label>
            <button
              onClick={handleGoogleContinue}
              disabled={status === "loading"}
              className="group flex items-center gap-3 text-lg font-bold uppercase tracking-wider hover:text-black/70 transition-colors disabled:opacity-50 w-fit"
            >
              <Chrome size={20} />
              {status === "loading" ? "Signing in..." : "Continue with Google"}
              <span className="group-hover:translate-x-2 transition-transform duration-300">-&gt;</span>
            </button>
          </div>

          {/* Status Messages */}
          <div className="mt-4">
            {status === "success" && (
              <p className="text-sm text-green-600 font-medium">Success! Redirecting...</p>
            )}
            {status === "error" && (
              <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Contact;
