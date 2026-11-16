import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  User, 
  GraduationCap, 
  Lock, 
  Phone, 
  Mail, 
  Building, 
  BookOpen, 
  Layers 
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { AUTH_API_URL, ACADEMIC_OPTIONS_URL, storeAuthSession } from "@/config/api";

interface AcademicData {
  universities: string[];
  colleges: string[];
  departments: string[];
  courses: string[];
  branches: string[];
  semesters: string[];
}

type Stage = "personal" | "academic";

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryEmail = searchParams.get("email") || "";
  const [stage, setStage] = useState<Stage>("personal");

  // Stage 1: Personal Details
  const [name, setName] = useState("");
  const [email, setEmail] = useState(queryEmail);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Stage 2: Academic Details
  const [rollNo, setRollNo] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [college, setCollege] = useState("");
  const [university, setUniversity] = useState("");

  // Dynamic Options from DB
  const [academicOptions, setAcademicOptions] = useState<AcademicData>({
    universities: [],
    colleges: [],
    departments: [],
    courses: [],
    branches: [],
    semesters: [],
  });

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (queryEmail) {
      setEmail(queryEmail);
    }
    fetchAcademicOptions();
  }, [queryEmail]);

  // Dynamic options fetch from Database with Refresh button support
  const fetchAcademicOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const res = await fetch(ACADEMIC_OPTIONS_URL, {
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAcademicOptions(json.data);
        // Pre-fill initial dropdowns if not yet selected
        if (!university && json.data.universities?.length) setUniversity(json.data.universities[0]);
        if (!college && json.data.colleges?.length) setCollege(json.data.colleges[0]);
        if (!department && json.data.departments?.length) setDepartment(json.data.departments[0]);
        if (!course && json.data.courses?.length) setCourse(json.data.courses[0]);
        if (!branch && json.data.branches?.length) setBranch(json.data.branches[0]);
        if (!semester && json.data.semesters?.length) setSemester(json.data.semesters[0]);
      }
    } catch {
      // Fallback defaults if offline
      setAcademicOptions({
        universities: ["CGC University", "IKG PTU"],
        colleges: ["Chandigarh Engineering College (CEC), Landran", "Chandigarh College of Technology (CCT)"],
        departments: ["Computer Science & Engineering", "Information Technology", "Computer Applications"],
        courses: ["B.Tech (Bachelor of Technology)", "BCA", "MCA"],
        branches: ["Computer Science & Engineering (Core)", "CSE - AI & ML", "CSE - Data Science", "Information Technology"],
        semesters: ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"],
      });
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Stage 1 Validation -> Next
  const handlePersonalNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter your full name");
      return;
    }
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setErrorMessage("");
    setStage("academic");
  };

  // Stage 2 Submit -> Create Account
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim()) {
      setErrorMessage("Please enter your university / college Roll Number");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        roll_no: rollNo.trim(),
        department,
        branch,
        course,
        semester,
        college,
        university,
      };

      const res = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
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
        setErrorMessage(data.error || data.message || "Failed to create account");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error connecting to auth server. Please try again.");
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
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl p-8 sm:p-12 rounded-[38px] bg-neutral-950 border border-white/10 shadow-2xl relative">
          
          {/* Multi-Stage Stepper Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border border-white/20 text-white bg-white/10">
                {stage === "personal" ? "STAGE 01 OF 02" : "STAGE 02 OF 02"}
              </span>
              <span className="text-xs font-mono text-white/40">
                {stage === "personal" ? "50% Complete" : "100% Ready"}
              </span>
            </div>

            {/* Stage Progress Bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: stage === "personal" ? "50%" : "100%" }}
              />
            </div>

            {/* Title & Stage Indicators */}
            <div className="flex items-center gap-4">
              <div
                onClick={() => setStage("personal")}
                className={`flex items-center gap-2 cursor-pointer pb-1 border-b-2 transition-all ${
                  stage === "personal"
                    ? "border-white text-white font-bold"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                <User size={15} />
                <span className="text-xs font-mono uppercase tracking-wider">1. Personal</span>
              </div>

              <span className="text-white/20 font-mono">/</span>

              <div
                className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${
                  stage === "academic"
                    ? "border-white text-white font-bold"
                    : "border-transparent text-white/40"
                }`}
              >
                <GraduationCap size={15} />
                <span className="text-xs font-mono uppercase tracking-wider">2. Academic</span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* STAGE 1: PERSONAL DETAILS                                 */}
          {/* ========================================================= */}
          <AnimatePresence mode="wait">
            {stage === "personal" && (
              <motion.form
                key="personal-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handlePersonalNext}
                className="flex flex-col gap-4"
              >
                {/* Full Name */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                    <User size={12} />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mayank Tiwari"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMessage("");
                    }}
                    required
                    className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all placeholder:text-white/30"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                    <Mail size={12} />
                    <span>Student Email Address *</span>
                  </label>
                  <input
                    type="email"
                    placeholder="enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                    }}
                    required
                    className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all placeholder:text-white/30"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                    <Phone size={12} />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all placeholder:text-white/30"
                  />
                </div>

                {/* Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Lock size={12} />
                      <span>Password *</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage("");
                      }}
                      required
                      className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Lock size={12} />
                      <span>Confirm Password *</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrorMessage("");
                      }}
                      required
                      className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all placeholder:text-white/30"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 text-xs text-rose-400 font-mono mt-1">
                    <AlertCircle size={14} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all group mt-3 shadow-md"
                >
                  <span>Next</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="flex-shrink mx-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    OR
                  </span>
                  <div className="flex-grow border-t border-white/10" />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setStatus("loading");
                      setErrorMessage("");
                      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
                      const { auth } = await import("../../firebase");
                      const provider = new GoogleAuthProvider();
                      const result = await signInWithPopup(auth, provider);
                      const gUser = result.user;
                      const idToken = await gUser.getIdToken();

                      const res = await fetch(`${AUTH_API_URL}/google-auth`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Accept: "application/json" },
                        body: JSON.stringify({
                          email: gUser.email,
                          name: gUser.displayName || gUser.email?.split("@")[0] || "User",
                          google_id: gUser.uid,
                          google_token: idToken,
                          avatar: gUser.photoURL || null,
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
                            navigate("/dashboard");
                          }
                        }, 800);
                      } else {
                        setStatus("error");
                        setErrorMessage(data.error || "Google sign-in failed on server");
                      }
                    } catch (err: any) {
                      setStatus("error");
                      setErrorMessage(err.message || "Google sign-in was cancelled or failed");
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl border border-white/20 hover:border-white bg-white/5 hover:bg-white/10 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-3"
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

            {/* ========================================================= */}
            {/* STAGE 2: ACADEMIC DETAILS                                 */}
            {/* ========================================================= */}
            {stage === "academic" && (
              <motion.form
                key="academic-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                onSubmit={handleFinalSubmit}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                      Academic Details
                    </h3>
                  </div>

                  {/* Refresh Button */}
                  <button
                    type="button"
                    onClick={fetchAcademicOptions}
                    disabled={isLoadingOptions}
                    title="Refresh dynamic options from database"
                    className="p-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
                  >
                    <RefreshCw size={13} className={isLoadingOptions ? "animate-spin text-white" : ""} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>

                {/* Roll Number */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                    <Layers size={12} />
                    <span>University / College Roll Number *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2108849 / 2201994"
                    value={rollNo}
                    onChange={(e) => {
                      setRollNo(e.target.value);
                      setErrorMessage("");
                    }}
                    required
                    className="w-full py-3.5 px-4 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all placeholder:text-white/30"
                  />
                </div>

                {/* University & College Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* University */}
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Building size={12} />
                      <span>University</span>
                    </label>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all cursor-pointer"
                    >
                      {academicOptions.universities.map((item, idx) => (
                        <option key={idx} value={item} className="bg-neutral-900 text-white">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* College */}
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Building size={12} />
                      <span>College / Institute</span>
                    </label>
                    <select
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all cursor-pointer"
                    >
                      {academicOptions.colleges.map((item, idx) => (
                        <option key={idx} value={item} className="bg-neutral-900 text-white">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Course & Semester Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Course */}
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                      <BookOpen size={12} />
                      <span>Course</span>
                    </label>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all cursor-pointer"
                    >
                      {academicOptions.courses.map((item, idx) => (
                        <option key={idx} value={item} className="bg-neutral-900 text-white">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Layers size={12} />
                      <span>Current Semester</span>
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all cursor-pointer"
                    >
                      {academicOptions.semesters.map((item, idx) => (
                        <option key={idx} value={item} className="bg-neutral-900 text-white">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Department & Branch Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department */}
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Building size={12} />
                      <span>Department</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all cursor-pointer"
                    >
                      {academicOptions.departments.map((item, idx) => (
                        <option key={idx} value={item} className="bg-neutral-900 text-white">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Layers size={12} />
                      <span>Branch / Specialization</span>
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 border border-white/15 focus:border-white text-white font-mono text-xs outline-none transition-all cursor-pointer"
                    >
                      {academicOptions.branches.map((item, idx) => (
                        <option key={idx} value={item} className="bg-neutral-900 text-white">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    <span>Registration verified! Entering dashboard...</span>
                  </div>
                )}

                {/* Buttons row */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStage("personal");
                      setErrorMessage("");
                    }}
                    className="py-4 px-6 rounded-2xl border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex-1 py-4 px-6 rounded-2xl bg-white text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all group disabled:opacity-50 shadow-md"
                  >
                    <span>{status === "loading" ? "Activating Account..." : "Create Account"}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Already have an account */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs font-mono text-white/50">
              Already have an account?{" "}
              <Link to="/login" className="text-white font-bold underline hover:text-white/80">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Footer reassurance */}
      <div className="relative z-10 py-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs font-mono text-white/40">
        <ShieldCheck size={14} />
        <span>Greetings from Codezen</span>
      </div>
    </div>
  );
};

export default Register;
