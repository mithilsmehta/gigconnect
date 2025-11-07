// src/pages/Register.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ParticleBackground from "../components/ParticleBackground.jsx";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { FcGoogle } from "react-icons/fc";

/* ----------------------------- Reusable Timer ----------------------------- */
function ResendOtpTimer({ onResend, busy }) {
  const [seconds, setSeconds] = useState(30);
  const canResend = seconds === 0;
  useEffect(() => {
    if (seconds === 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const handle = async () => {
    if (!canResend || busy) return;
    await onResend();
    toast.info("New OTP sent!");
    setSeconds(30);
  };
  return (
    <div className="text-center small mt-2">
      {canResend ? (
        <button
          type="button"
          className="border-0 bg-transparent fw-semibold"
          style={{ color: "#16a34a", cursor: "pointer" }}
          onClick={handle}
        >
          🔄 Resend OTP
        </button>
      ) : (
        <span className="text-muted">
          Resend available in <span className="text-success">{seconds}s</span>
        </span>
      )}
    </div>
  );
}

/* ----------------------- CATEGORIES → SUBCATS → SKILLS -------------------- */
const CATEGORY_TREE = {
  "Websites, IT & Software": {
    "Web Development": [
      "HTML/CSS",
      "JavaScript",
      "React",
      "Next.js",
      "Node.js",
      "Express",
      "PHP",
      "Laravel",
      "WordPress",
      "Shopify",
    ],
    "Mobile Development": ["Android", "iOS", "Flutter", "React Native", "Kotlin", "Swift"],
    "Backend & APIs": ["REST APIs", "GraphQL", "Python/Django", "FastAPI", "Java/Spring"],
    "Cloud & DevOps": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD"],
  },
  "Design & Creative": {
    "Brand & Identity": ["Logo Design", "Brand Guidelines", "Stationery"],
    "UI/UX": ["Figma", "Wireframing", "Prototyping", "Design Systems"],
    "Graphics": ["Illustration", "Banner Design", "Social Media Creatives", "Canva"],
  },
  "Writing & Translation": {
    "Writing": ["Blog Writing", "Copywriting", "Technical Writing", "Product Descriptions"],
    "Translation": ["English", "Hindi", "Gujarati", "French", "Spanish"],
  },
  "Sales & Marketing": {
    "Digital Marketing": ["SEO", "SEM", "SMM", "Email Marketing"],
    "Paid Ads": ["Google Ads", "Meta Ads", "LinkedIn Ads"],
    "Analytics": ["GA4", "Tag Manager", "A/B Testing"],
  },
  "Video & Animation": {
    "Video": ["Video Editing", "Reels/TikTok", "Motion Graphics"],
    "Animation": ["2D Animation", "Explainer Videos", "Lottie"],
  },
};

const makeRoleBlock = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  category: "",
  subcategory: "",
  skills: [],
});

/* ------------------------------ Experience -------------------------------- */
const TYPE_VALUES = ["remote", "onsite", "hybrid"];
const makeExperience = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  title: "",
  company: "",
  type: "",
  startYear: "",
  endYear: "",
  present: false,
});

function RegisterCore() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState("light");

  // Common signup state
  const [resumeFile, setResumeFile] = useState(null); // freelancer only
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [profileCreating, setProfileCreating] = useState(false);

  // Client: category/skills blocks
  const [clientRoleBlocks, setClientRoleBlocks] = useState([makeRoleBlock()]);

  // Both roles: unlimited experiences
  const [experiences, setExperiences] = useState([makeExperience()]);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const { register, watch, setValue, getValues } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
      skills: "", // for freelancer free-text; client is aggregated from blocks
      goal: "",
      languages: [{ id: Date.now(), name: "English", level: "" }],
      bio: "",
      hourlyRate: "",
    },
  });

  const currentRole = watch("role");
  const languages = watch("languages");
  const bio = watch("bio") || "";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  /* ---------------------------- Google Signup ---------------------------- */
  const googleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      // check does this email exists?
      const check = await axios.post("http://localhost:5000/api/auth/check-user", {
        email: gUser.email,
      });

      if (check.data.exists) {
        // already registered
        toast.success("Welcome back! Please login.");
        navigate("/login");
        return;
      }

      // new google user → continue onboarding from Step 2
      setValue("firstName", gUser.displayName?.split(" ")[0] || "");
      setValue("lastName", gUser.displayName?.split(" ")[1] || "");
      setValue("email", gUser.email);

      setEmailVerified(true);

      toast.success("Google connected! Continue to choose your role.");
      setStep(2);

    } catch (error) {
      console.log(error);
      toast.error("Google authentication failed!");
    }
  };

  /* ----------------------------- Email OTP ------------------------------- */
  const sendOtp = async () => {
    try {
      const email = getValues("email");
      if (!email) return toast.error("Enter your email first");
      setOtpBusy(true);
      await axios.post("http://localhost:5000/api/auth/send-otp", { email });
      toast.success("OTP sent!");
      setOtpSent(true);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async () => {
    try {
      const email = getValues("email");
      if (!email || !otpInput) return toast.error("Enter OTP");
      setOtpBusy(true);
      await axios.post("http://localhost:5000/api/auth/verify-otp", { email, otp: otpInput });
      toast.success("Email verified!");
      setEmailVerified(true);
      setOtpSent(false);
    } catch (e) {
      console.error(e);
      toast.error("Invalid or expired OTP");
    } finally {
      setOtpBusy(false);
    }
  };

  /* --------------------------- Step Navigation --------------------------- */
  const titles = useMemo(() => {
    if (currentRole === "client") {
      return ["Create Account", "Choose Role", "Experience", "Choose Category", "Select Skills"];
    }
    if (currentRole === "freelancer") {
      return [
        "Create Account",
        "Choose Role",
        "Freelancer",
        "Freelance Goal",
        "Skills",
        "Upload Resume",
        "Experience",
        "Languages",
        "Bio",
        "Hourly Rate",
      ];
    }
    return ["Create Account", "Choose Role"];
  }, [currentRole]);

  const maxSteps = titles.length;

  const onNext = () => {
    const v = getValues();

    // Step 1 checks
    if (step === 1) {
      if (!v.firstName || !v.lastName || !v.email || !phone || !v.password || !v.confirmPassword)
        return toast.error("All fields required!");
      if (v.password !== v.confirmPassword) return toast.error("Passwords do not match");
      if (!emailVerified) return toast.error("Please verify your email first");
    }

    // Step 2 checks
    if (step === 2) {
      if (!v.role) return toast.error("Select your role");
      setStep((s) => s + 1);
      return;
    }

    // Client validations
    if (currentRole === "client") {
      if (step === 3) {
        // experience is optional (format A) — no hard validation
      }
      if (step === 4) {
        const ok = clientRoleBlocks.every((b) => b.category);
        if (!ok) return toast.error("Pick at least one category");
      }
      setStep((s) => Math.min(s + 1, maxSteps));
      return;
    }

    // Freelancer validations
    if (currentRole === "freelancer") {
      if (step === 3 && !v.goal && false) {
        // placeholder (no validation here; real goal is step 4)
      }
      if (step === 4 && !v.goal) return toast.error("Select your goal");
      if (step === 5 && !v.skills) return toast.error("Enter your skills");
      if (step === 6 && !resumeFile) return toast.error("Please upload your resume");
      if (step === 7) {
        // experiences optional in format A
      }
      if (step === 8 && languages.some((l) => !l.level || !l.name.trim()))
        return toast.error("Fill all language rows");
      if (step === 9 && (!v.bio || v.bio.trim().split(/\s+/).length < 50))
        return toast.error("Bio must be at least 50 words");
      if (step === 10 && !v.hourlyRate) return toast.error("Enter hourly rate");
    }

    setStep((s) => Math.min(s + 1, maxSteps));
  };

  const onBack = () => setStep((s) => Math.max(1, s - 1));

  /* --------------------------- Register Account -------------------------- */
  const registerUserAccount = async () => {
    const data = getValues();
    if (!executeRecaptcha) throw new Error("reCAPTCHA not ready. Please try again.");
    const recaptchaToken = await executeRecaptcha("register");

    // Compute skills for client from role blocks
    let skillsToSave = data.skills;
    if (currentRole === "client") {
      const set = new Set();
      clientRoleBlocks.forEach((b) => b.skills.forEach((sk) => set.add(sk)));
      skillsToSave = Array.from(set).join(", ");
      setValue("skills", skillsToSave);
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      phone,
      role: data.role,
      skills: skillsToSave,
      experiences, // send entire array (both roles)
      recaptchaToken,
      hourlyRate: data.hourlyRate || 0,
      about: data.bio || "",
      country: data.country || "",
      countryCode: data.countryCode || "+91",
    };

    const response = await axios.post("http://localhost:5000/api/auth/register", payload, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Registration failed");
    }
    return response.data;
  };

  /* --------------------------- Create Profiles --------------------------- */
  const createClientProfile = async () => {
    try {
      setProfileCreating(true);

      const uniqueSkills = new Set();
      clientRoleBlocks.forEach((b) => b.skills.forEach((s) => uniqueSkills.add(s)));
      if (uniqueSkills.size === 0) {
        toast.error("Select at least one skill");
        return;
      }

      await registerUserAccount();
      toast.success("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || "Failed to create account.");
    } finally {
      setProfileCreating(false);
    }
  };

  const createFreelancerProfile = async () => {
    try {
      setProfileCreating(true);
      await registerUserAccount();
      toast.success("Profile created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || "Failed to create profile.");
    } finally {
      setProfileCreating(false);
    }
  };

  /* --------------------------- Helpers: Client --------------------------- */
  const subcategoriesFor = (category) => {
    if (!category) return [];
    return Object.keys(CATEGORY_TREE[category] || {});
  };

  const skillsFor = (category, subcategory) => {
    if (!category || !subcategory) return [];
    return CATEGORY_TREE[category]?.[subcategory] || [];
  };

  const onChangeCategory = (id, category) => {
    setClientRoleBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, category, subcategory: "", skills: [] } : b
      )
    );
  };

  const onChangeSubcategory = (id, subcategory) => {
    setClientRoleBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, subcategory, skills: [] } : b))
    );
  };

  const toggleSkill = (id, skill) => {
    setClientRoleBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const exists = b.skills.includes(skill);
        return { ...b, skills: exists ? b.skills.filter((s) => s !== skill) : [...b.skills, skill] };
      })
    );
  };

  const addRoleBlock = () => setClientRoleBlocks((prev) => [...prev, makeRoleBlock()]);
  const removeRoleBlock = (id) =>
    setClientRoleBlocks((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== id) : prev));

  /* -------------------------- Helpers: Experience ------------------------ */
  const addExperience = () => setExperiences((prev) => [...prev, makeExperience()]);
  const removeExperience = (id) =>
    setExperiences((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));

  const setExpField = (id, field, value) => {
    setExperiences((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const togglePresent = (id) => {
    setExperiences((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
            ...e,
            present: !e.present,
            endYear: !e.present ? "Present" : "",
          }
          : e
      )
    );
  };

  /* ------------------------------- Styling -------------------------------- */
  const fade = { animation: "fade .35s ease" };
  const keyframes = `
    @keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .cursor-pointer { cursor: pointer; }
    .transition-all { transition: all 0.2s ease; }
    .form-control:focus, .form-select:focus {
      border-color: #198754;
      box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
    }
    .card {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.95) !important;
    }
    .card.bg-dark {
      background: rgba(33, 37, 41, 0.95) !important;
    }
    .skill-chip {
      border: 1px solid #d1d5db;
      border-radius: 999px;
      padding: .25rem .6rem;
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      margin: .25rem;
      font-size: .85rem;
      background: #fff;
    }
    .skill-chip.active {
      border-color: #198754;
      background: rgba(25, 135, 84, .08);
    }
  `;

  /* -------------------------- Navigation Footer --------------------------- */
  const NavigationController = () => {
    // Step 1
    if (step === 1) {
      return (
        <div className="d-flex justify-content-center mt-4 pt-3 border-top">
          <button className="btn btn-success w-100" onClick={onNext}>
            Continue →
          </button>
        </div>
      );
    }

    // Step 2
    if (step === 2) {
      return (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary px-4" onClick={onBack}>
            ← Back
          </button>
          <button className="btn btn-success px-4" onClick={onNext}>
            Continue →
          </button>
        </div>
      );
    }

    // Client Steps
    if (currentRole === "client" && [3, 4, 5].includes(step)) {
      return (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary px-4" onClick={onBack}>
            ← Back
          </button>
          {step < 5 ? (
            <button className="btn btn-success px-4" onClick={onNext}>
              Next →
            </button>
          ) : (
            <button
              className="btn btn-success px-4"
              disabled={profileCreating}
              onClick={createClientProfile}
            >
              {profileCreating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                <>✅ Create Account</>
              )}
            </button>
          )}
        </div>
      );
    }

    // Freelancer Steps
    if (currentRole === "freelancer" && step >= 3) {
      const last = 10;
      return (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary px-4" onClick={onBack}>
            ← Back
          </button>
          {step < last ? (
            <button className="btn btn-success px-4" onClick={onNext}>
              Next →
            </button>
          ) : (
            <button
              className="btn btn-success px-4"
              disabled={profileCreating}
              onClick={createFreelancerProfile}
            >
              {profileCreating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                <>✅ Create Profile</>
              )}
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  /* --------------------------------- UI ---------------------------------- */
  return (
    <>
      <ParticleBackground />
      <style>{keyframes}</style>
      <ToastContainer position="top-center" />

      <div className="position-fixed top-0 end-0 p-3">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      <div className="d-flex align-items-center justify-content-center vh-100 px-3">
        <div
          className={`card shadow-lg p-4 rounded-4 border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-light"}`}
          style={{ width: "100%", maxWidth: 560, ...fade }}
        >
          {/* Progress */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4 className="text-success fw-bold mb-0">{titles[step - 1] || "Registration"}</h4>
              <small className="text-muted">Step {step} of {maxSteps}</small>
            </div>
            <div className="progress" style={{ height: "4px" }}>
              <div className="progress-bar bg-success" style={{ width: `${(step / maxSteps) * 100}%` }} />
            </div>
          </div>

          {/* STEP 1 – Create Account */}
          {step === 1 && (
            <>
              <button
                onClick={googleSignup}
                className="btn btn-light border w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
              >
                <FcGoogle /> Continue with Google
              </button>

              <div className="d-flex align-items-center mb-3">
                <hr className="flex-grow-1" />
                <span className="mx-2 text-muted">or</span>
                <hr className="flex-grow-1" />
              </div>

              <div className="row mb-3">
                <div className="col">
                  <input className="form-control rounded-3" placeholder="First name *" {...register("firstName")} />
                </div>
                <div className="col">
                  <input className="form-control rounded-3" placeholder="Last name *" {...register("lastName")} />
                </div>
              </div>

              <input type="email" className="form-control rounded-3 mb-3" placeholder="Email *" {...register("email")} />
              <PhoneInput country={"in"} value={phone} onChange={setPhone} inputClass="w-100" />

              <div className="row my-3">
                <div className="col">
                  <input type="password" className="form-control rounded-3" placeholder="Password *" {...register("password")} />
                </div>
                <div className="col">
                  <input type="password" className="form-control rounded-3" placeholder="Confirm Password *" {...register("confirmPassword")} />
                </div>
              </div>

              {!emailVerified ? (
                !otpSent ? (
                  <button className="btn btn-outline-success w-100" disabled={otpBusy} onClick={sendOtp}>
                    Send OTP
                  </button>
                ) : (
                  <>
                    <input
                      type="text"
                      className="form-control text-center my-2"
                      placeholder="Enter OTP"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                    />
                    <button className="btn btn-success w-100" onClick={verifyOtp} disabled={otpBusy}>
                      Verify Email
                    </button>
                    <ResendOtpTimer onResend={sendOtp} busy={otpBusy} />
                  </>
                )
              ) : (
                <div className="alert alert-success text-center py-2 mb-0">✅ Email Verified</div>
              )}

              <p className="text-center mt-3">
                Already have an account?{" "}
                <Link to="/login" className={`fw-semibold text-decoration-none ${theme === "dark" ? "text-info" : "text-success"}`}>
                  Login
                </Link>
              </p>
            </>
          )}

          {/* STEP 2 – Choose Role */}
          {step === 2 && (
            <div className="mb-2">
              <div className="d-flex gap-3 mb-4">
                {["client", "freelancer"].map((r) => (
                  <div
                    key={r}
                    className={`flex-fill p-4 border rounded-3 text-center cursor-pointer transition-all ${currentRole === r ? "border-success bg-success bg-opacity-10 shadow-sm" : "border-2"
                      }`}
                    role="button"
                    onClick={() => setValue("role", r)}
                  >
                    <h5 className="fw-semibold text-success mb-1 text-capitalize">{r}</h5>
                    <small className="text-muted">
                      {r === "client" ? "Hire freelancers" : "Offer services"}
                    </small>
                  </div>
                ))}
              </div>

              {currentRole === "client" && (
                <div className="alert alert-info text-center">
                  <h6 className="fw-semibold mb-2">🧭 Quick setup</h6>
                  <p className="mb-0 small">Add experience, choose category & skills, then create your account.</p>
                </div>
              )}
              {currentRole === "freelancer" && (
                <div className="alert alert-info text-center">
                  <h6 className="fw-semibold mb-2">📝 Full profile flow</h6>
                  <p className="mb-0 small">We’ll collect details to help clients find you.</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3 (client) / STEP 7 (freelancer) — Experience (Format A) */}
          {((currentRole === "client" && step === 3) ||
            (currentRole === "freelancer" && step === 7)) && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Experience</h6>
                  <button type="button" className="btn btn-outline-success btn-sm" onClick={addExperience}>
                    + Add experience
                  </button>
                </div>

                {experiences.map((ex, idx) => (
                  <div key={ex.id} className="border rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Role {idx + 1}</strong>
                      {experiences.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeExperience(ex.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <input
                          className="form-control"
                          placeholder="Title (e.g., Frontend Developer)"
                          value={ex.title}
                          onChange={(e) => setExpField(ex.id, "title", e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <input
                          className="form-control"
                          placeholder="Company"
                          value={ex.company}
                          onChange={(e) => setExpField(ex.id, "company", e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <select
                          className="form-select"
                          value={ex.type}
                          onChange={(e) => setExpField(ex.id, "type", e.target.value)}
                        >
                          <option value="">Type (remote / onsite / hybrid)</option>
                          {TYPE_VALUES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-6 col-md-4">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Start Year (YYYY)"
                          value={ex.startYear}
                          onChange={(e) => setExpField(ex.id, "startYear", e.target.value)}
                        />
                      </div>

                      <div className="col-6 col-md-4">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="End Year (YYYY)"
                          value={ex.endYear}
                          disabled={ex.present}
                          onChange={(e) => setExpField(ex.id, "endYear", e.target.value)}
                        />
                        <div className="form-check mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`present-${ex.id}`}
                            checked={ex.present}
                            onChange={() => togglePresent(ex.id)}
                          />
                          <label className="form-check-label" htmlFor={`present-${ex.id}`}>
                            Present
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* CLIENT – Choose Category (Step 4) */}
          {currentRole === "client" && step === 4 && (
            <div>
              {clientRoleBlocks.map((block, idx) => {
                const subcats = subcategoriesFor(block.category);
                return (
                  <div key={block.id} className="border rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Role {idx + 1}</h6>
                      {clientRoleBlocks.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeRoleBlock(block.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-select"
                        value={block.category}
                        onChange={(e) => onChangeCategory(block.id, e.target.value)}
                      >
                        <option value="">Select a category</option>
                        {Object.keys(CATEGORY_TREE).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Specialization (Subcategory)</label>
                      <select
                        className="form-select"
                        value={block.subcategory}
                        onChange={(e) => onChangeSubcategory(block.id, e.target.value)}
                        disabled={!block.category}
                      >
                        <option value="">Select a specialization</option>
                        {subcats.map((sc) => (
                          <option key={sc} value={sc}>
                            {sc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

              <button type="button" className="btn btn-outline-success btn-sm" onClick={addRoleBlock}>
                + Add another role
              </button>
            </div>
          )}

          {/* CLIENT – Select Skills (Step 5) */}
          {currentRole === "client" && step === 5 && (
            <div>
              {clientRoleBlocks.map((block, idx) => {
                const skillList =
                  skillsFor(block.category, block.subcategory) ||
                  (block.category
                    ? Array.from(
                      new Set(Object.values(CATEGORY_TREE[block.category] || {}).flat())
                    )
                    : []);
                return (
                  <div key={block.id} className="border rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">
                        Role {idx + 1} {block.category ? `• ${block.category}` : ""}{" "}
                        {block.subcategory ? `→ ${block.subcategory}` : ""}
                      </h6>
                      {clientRoleBlocks.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeRoleBlock(block.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {skillList.length === 0 ? (
                      <div className="text-muted small">
                        Select a category (and optional specialization) first.
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2 small text-muted">
                          Pick your required skills (multi-select).
                        </div>
                        <div>
                          {skillList.map((sk) => {
                            const active = block.skills.includes(sk);
                            return (
                              <button
                                key={sk}
                                type="button"
                                className={`skill-chip ${active ? "active" : ""}`}
                                onClick={() => toggleSkill(block.id, sk)}
                                title={sk}
                              >
                                {active ? "✅" : "➕"} {sk}
                              </button>
                            );
                          })}
                        </div>
                        {block.skills.length > 0 && (
                          <div className="mt-2">
                            <small className="text-success">
                              Selected: {block.skills.join(", ")}
                            </small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="text-end">
                <button type="button" className="btn btn-outline-success btn-sm" onClick={addRoleBlock}>
                  + Add another role
                </button>
              </div>
            </div>
          )}

          {/* FREELANCER – Goal (Step 4) */}
          {currentRole === "freelancer" && step === 4 && (
            <div>
              <p className="mb-3 fw-semibold">What’s your biggest goal for freelancing?</p>
              {[
                "To earn my main income",
                "To make money on the side",
                "To get experience for a full-time job",
                "I don't have a goal in mind yet",
              ].map((t) => (
                <div
                  key={t}
                  className={`border rounded-3 p-3 mb-2 ${watch("goal") === t ? "border-success bg-success bg-opacity-10" : ""}`}
                  role="button"
                  onClick={() => setValue("goal", t)}
                >
                  {t}
                </div>
              ))}
            </div>
          )}

          {currentRole === "freelancer" && step === 3 && (
            <div className="mb-4">
              <h5 className="fw-bold mb-2">Have you freelanced before?</h5>
              <p className="text-muted small mb-4">
                This lets us know how much help to give you along the way.
                We won’t share your answer with anyone else, including potential clients.
              </p>

              {[
                "I am brand new to this",
                "I have some experience",
                "I am an expert"
              ].map((t) => (
                <div
                  key={t}
                  className={`border rounded-3 p-3 mb-3 cursor-pointer transition-all ${watch("experienceLevel") === t ? "border-success bg-success bg-opacity-10 shadow-sm" : ""
                    }`}
                  role="button"
                  onClick={() => setValue("experienceLevel", t)}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
          {/* FREELANCER – Skills (Step 5) */}
          {currentRole === "freelancer" && step === 5 && (
            <div className="mb-4">
              <label className="fw-semibold mb-2 d-block">Enter up to 15 skills *</label>
              <input
                className="form-control rounded-3"
                placeholder="e.g., React, Node.js, Python, JavaScript, UI/UX Design"
                {...register("skills")}
              />
              <small className="text-muted mt-1 d-block">Separate skills with commas</small>
            </div>
          )}

          {/* FREELANCER – Resume (Step 6) */}
          {currentRole === "freelancer" && step === 6 && (
            <div className="mb-4">
              <label className="fw-semibold mb-2 d-block">Upload Resume (Required) *</label>
              {!resumeFile ? (
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="form-control"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setResumeFile(file);
                    }}
                  />
                  <small className="text-muted mt-1 d-block">Accepted: PDF, DOC, DOCX (Max 5MB)</small>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-between border rounded-3 p-3 bg-light">
                  <div className="d-flex align-items-center">
                    <span className="text-success me-2">📄</span>
                    <span className="fw-medium">{resumeFile.name}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setResumeFile(null)}
                  >
                    🗑️ Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FREELANCER – Languages (Step 8) */}
          {currentRole === "freelancer" && step === 8 && (
            <div className="mb-4">
              <label className="fw-semibold mb-3 d-block">Languages *</label>
              {languages.map((l, i) => (
                <div key={l.id} className="d-flex mb-3 align-items-center gap-2">
                  <input
                    className="form-control"
                    placeholder="Language name"
                    value={l.name}
                    onChange={(e) => {
                      const updated = [...languages];
                      updated[i].name = e.target.value;
                      setValue("languages", updated);
                    }}
                  />
                  <select
                    className="form-select"
                    value={l.level}
                    onChange={(e) => {
                      const updated = [...languages];
                      updated[i].level = e.target.value;
                      setValue("languages", updated);
                    }}
                  >
                    <option value="">Select Level</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Professional</option>
                    <option>Fluent</option>
                    <option>Native</option>
                  </select>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-success btn-sm mt-2"
                onClick={() =>
                  setValue("languages", [
                    ...languages,
                    { id: Date.now() + Math.random(), name: "", level: "" },
                  ])
                }
              >
                + Add Language
              </button>
            </div>
          )}

          {/* FREELANCER – Bio (Step 9) */}
          {currentRole === "freelancer" && step === 9 && (
            <div className="mb-4">
              <label className="fw-semibold mb-2 d-block">Bio (50–5000 words) *</label>
              <textarea
                className="form-control mb-2"
                rows="6"
                placeholder="Tell the world about yourself, your skills, and experience..."
                {...register("bio")}
              />
              <small
                className={`text-muted ${bio.trim().split(/\s+/).filter(Boolean).length < 50 ? "text-danger" : "text-success"
                  }`}
              >
                Word count: {bio.trim().split(/\s+/).filter(Boolean).length} / 50 minimum
              </small>
            </div>
          )}

          {/* FREELANCER – Rate (Step 10) */}
          {currentRole === "freelancer" && step === 10 && (
            <div className="mb-4">
              <label className="fw-semibold mb-2 d-block">Hourly Rate *</label>
              <div className="input-group mb-3">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="25"
                  min="5"
                  max="500"
                  {...register("hourlyRate")}
                />
                <span className="input-group-text">USD/hour</span>
              </div>
              <small className="text-muted mt-1 d-block">
                Set a competitive rate based on your skills and experience
              </small>
            </div>
          )}

          {/* Footer Navigation */}
          <NavigationController />
        </div>
      </div>
    </>
  );
}

/* ------------------------------- Export ---------------------------------- */
export default function Register() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6LfNDPYrAAAAAHBlsUWPNx1q7blEyzkK4BPptf_P">
      <RegisterCore />
    </GoogleReCaptchaProvider>
  );
}