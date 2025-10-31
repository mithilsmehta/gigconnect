import { useEffect, useState } from "react";
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

function RegisterCore() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState("light");
  const [resumeFile, setResumeFile] = useState(null);
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [profileCreating, setProfileCreating] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const { register, watch, setValue, getValues } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
      skills: "",
      experienceLevel: "",
      goal: "",
      companyName: "",
      companyRole: "",
      experienceYears: "",
      degreeName: "",
      startYear: "",
      endYear: "",
      languages: [{ id: Date.now(), name: "English", level: "" }],
      bio: "",
      hourlyRate: "",
    },
  });

  const languages = watch("languages");
  const bio = watch("bio") || "";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);



  const updateLanguageLevel = (i, val) => {
    const updated = [...languages];
    updated[i].level = val;
    setValue("languages", updated);
  };

  const addLanguage = () => {
    const updated = [...languages, { id: Date.now() + Math.random(), name: "", level: "" }];
    setValue("languages", updated);
  };

  const removeLanguage = (id) => {
    if (languages.length > 1) {
      const updated = languages.filter((lang) => lang.id !== id);
      setValue("languages", updated);
    }
  };

  const googleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;
      const res = await axios.post("http://localhost:5000/api/auth/google-login", {
        email: gUser.email,
        firstName: gUser.displayName?.split(" ")[0] || "",
        lastName: gUser.displayName?.split(" ")[1] || "",
      });
      if (res.data.success) {
        if (!res.data.isNew) {
          localStorage.setItem("token", res.data.token);
          toast.success("Welcome back!");
          setTimeout(() => navigate("/home"), 800);
          return;
        }
        setValue("firstName", gUser.displayName?.split(" ")[0] || "");
        setValue("lastName", gUser.displayName?.split(" ")[1] || "");
        setValue("email", gUser.email);
        setEmailVerified(true);
        localStorage.setItem("token", res.data.token);
        toast.success("Google connected! Continue setup.");
        setStep(2);
      }
    } catch {
      toast.error("Google signup failed.");
    }
  };

  const sendOtp = async () => {
    try {
      const email = getValues("email");
      if (!email) return toast.error("Enter your email first");
      setOtpBusy(true);
      
      console.log("Sending OTP to:", email);
      const response = await axios.post("http://localhost:5000/api/auth/send-otp", { email });
      console.log("OTP response:", response.data);
      
      toast.success("OTP sent!");
      setOtpSent(true);
    } catch (error) {
      console.error("OTP send error:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 404) {
        toast.error("OTP service not available. Please try again later.");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error("Network error. Please check your connection and server status.");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async () => {
    try {
      const email = getValues("email");
      if (!email || !otpInput) return toast.error("Enter OTP");
      setOtpBusy(true);

      console.log("Verifying OTP for:", email, "OTP:", otpInput);
      const response = await axios.post("http://localhost:5000/api/auth/verify-otp", { email, otp: otpInput });
      console.log("OTP verification response:", response.data);

      // If the verification returns a token, store it
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      toast.success("Email verified!");
      setEmailVerified(true);
      setOtpSent(false);
    } catch (error) {
      console.error("OTP verification error:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error("Invalid or expired OTP. Please try again.");
      } else {
        toast.error("OTP verification failed. Please try again.");
      }
    } finally {
      setOtpBusy(false);
    }
  };

  const onNext = () => {
    const v = getValues();

    if (step === 1) {
      if (!v.firstName || !v.lastName || !v.email || !phone || !v.password || !v.confirmPassword)
        return toast.error("All fields required!");
      if (v.password !== v.confirmPassword) return toast.error("Passwords do not match");
      if (!emailVerified) return toast.error("Please verify your email first");
    }

    if (step === 2) {
      if (!v.role) return toast.error("Select your role");

      // If client is selected, create profile directly
      if (v.role === "client") {
        createClientProfile();
        return;
      }
    }

    // Freelancer-specific validations (only for freelancer role)
    if (v.role === "freelancer") {
      if (step === 3 && !v.experienceLevel) return toast.error("Select an experience level");
      if (step === 4 && !v.goal) return toast.error("Select a goal");
      if (step === 5 && !v.skills) return toast.error("Enter your skills");
      if (step === 6 && !resumeFile) return toast.error("Please upload your resume");
      if (step === 7 && (!v.companyName || !v.companyRole || !v.experienceYears))
        return toast.error("Please fill all experience details");
      if (step === 8 && (!v.degreeName || !v.startYear || !v.endYear))
        return toast.error("Enter your degree and duration");
      if (step === 9 && languages.some((l) => !l.level || !l.name.trim()))
        return toast.error("Please fill in all language fields");
      if (step === 10 && (!v.bio || v.bio.trim().split(/\s+/).length < 50))
        return toast.error("Bio must be at least 50 words");
      if (step === 11 && !v.hourlyRate) return toast.error("Enter hourly rate");
    }

    setStep((s) => s + 1);
  };

  const onBack = () => setStep((s) => Math.max(1, s - 1));
// Register user account first to get authentication token (if available)
const registerUserAccount = async () => {
  try {
    const data = getValues();

    if (!executeRecaptcha) throw new Error("reCAPTCHA not ready. Please try again.");
    const recaptchaToken = await executeRecaptcha("register");

    const registerPayload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      phone: phone,
      role: data.role,
      recaptchaToken,
    };

    const response = await axios.post(
      "http://localhost:5000/api/auth/register",
      registerPayload,
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Register API response:", response.data);

    if (response.data.success) {
      const token = response.data.token || null;
      if (token) {
        localStorage.setItem("token", token);
        console.log("🔑 Token saved to localStorage");
      } else {
        console.warn("⚠️ No token received from backend (continuing without auth token)");
      }
      return token;
    } else {
      throw new Error(response.data.message || "Registration failed");
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    const msg =
      error.response?.data?.message ||
      error.message ||
      "Failed to register account.";
    toast.error(msg);
    throw new Error(msg);
  }
};

  const createFreelancerProfile = async () => {
    try {
      setProfileCreating(true);
      const data = getValues();

      // Validate required fields
      if (!data.firstName || !data.lastName || !data.email) {
        toast.error("Missing basic information. Please go back and fill all required fields.");
        return;
      }

      let token = localStorage.getItem("token");

      // If no token exists, register the user first
      if (!token) {
        console.log("No token found, registering user account first...");
        try {
          token = await registerUserAccount();
        } catch (error) {
          if (error.response?.data?.message) {
            toast.error(error.response.data.message);
          } else if (error.message.includes("reCAPTCHA")) {
            toast.error(error.message);
          }
          return;
        }
      }

      // Now create the freelancer profile
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: phone,
        role: data.role,
        skills: data.skills,
        experienceLevel: data.experienceLevel,
        goal: data.goal,
        companyName: data.companyName,
        companyRole: data.companyRole,
        experienceYears: parseInt(data.experienceYears) || 0,
        degreeName: data.degreeName,
        startYear: parseInt(data.startYear) || new Date().getFullYear(),
        endYear: data.endYear,
        bio: data.bio,
        hourlyRate: parseFloat(data.hourlyRate) || 0,
        resume: resumeFile?.name || "",
        languages: languages.filter(lang => lang.name.trim() && lang.level).map(lang => ({
          name: lang.name.trim(),
          level: lang.level
        }))
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

    //   toast.success("Profile created successfully!");
    //   setTimeout(() => navigate("/home"), 1200);
    // } catch (error) {
    //   console.error("Profile creation error:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 401) {
        toast.error("Authentication failed. Please try again.");
      } else if (error.response?.status === 400) {
        toast.error("Invalid data provided. Please check all fields.");
      } else if (error.response?.status === 404) {
        toast.error("API endpoint not found. Please check server configuration.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("Failed to create profile. Please try again.");
      }
    } finally {
      setProfileCreating(false);
    }
  };

  const createClientProfile = async () => {
    try {
      setProfileCreating(true);
      const data = getValues();

      let token = localStorage.getItem("token");

      // If no token exists, register the user first
      if (!token) {
        console.log("No token found, registering user account first...");
        try {
          token = await registerUserAccount();
        } catch (error) {
          if (error.response?.data?.message) {
            toast.error(error.response.data.message);
          } else if (error.message.includes("reCAPTCHA")) {
            toast.error(error.message);
          } else {
            toast.error("Failed to create user account. Please try again.");
          }
          return;
        }
      }

      // Now create the client profile (for clients, we might just need the basic registration)
      toast.success("Account created successfully!");
      setTimeout(() => navigate("/home"), 1200);

    } catch (error) {
      console.error("Client profile creation error:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setProfileCreating(false);
    }
  };

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
  `;

  const getStepTitles = () => {
    const currentRole = watch("role");

    if (currentRole === "client") {
      return ["Create Account", "Choose Role"];
    } else if (currentRole === "freelancer") {
      return [
        "Create Account",
        "Choose Role",
        "Freelancer Experience",
        "Freelance Goal",
        "Skills",
        "Upload Resume",
        "Experience",
        "Education",
        "Languages",
        "Bio",
        "Hourly Rate",
      ];
    } else {
      // Default before role selection
      return ["Create Account", "Choose Role"];
    }
  };

  const titles = getStepTitles();
  const maxSteps = titles.length;

  // Navigation Controller Component
  const NavigationController = () => {
    const currentRole = watch("role");

    if (step === 1) {
      return (
        <div className="d-flex justify-content-center mt-4 pt-3 border-top">
          <button className="btn btn-success w-100" onClick={onNext}>
            Continue →
          </button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary px-4" onClick={onBack}>
            ← Back
          </button>

          <button
            className="btn btn-success px-4"
            disabled={profileCreating}
            onClick={onNext}
          >
            {profileCreating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating...
              </>
            ) : currentRole === "client" ? (
              <>✅ Create Profile</>
            ) : (
              <>Continue →</>
            )}
          </button>
        </div>
      );
    }

    // For freelancer steps 3-11
    if (currentRole === "freelancer" && step >= 3) {
      return (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary px-4" onClick={onBack}>
            ← Back
          </button>

          {step < 11 ? (
            <button className="btn btn-success px-4" onClick={onNext}>
              Next →
            </button>
          ) : (
            <button
              className="btn btn-success px-4"
              disabled={profileCreating}
              onClick={() => {
                // Final validation before creating profile
                const v = getValues();
                if (!v.hourlyRate) {
                  toast.error("Enter hourly rate");
                  return;
                }
                if (languages.some((l) => !l.level || !l.name.trim())) {
                  toast.error("Please fill in all language fields");
                  return;
                }
                if (!v.bio || v.bio.trim().split(/\s+/).length < 50) {
                  toast.error("Bio must be at least 50 words");
                  return;
                }
                createFreelancerProfile();
              }}
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
          className={`card shadow-lg p-4 rounded-4 border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-light"
            }`}
          style={{ width: "100%", maxWidth: 540, ...fade }}
        >
          {/* Progress Indicator */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4 className="text-success fw-bold mb-0">{titles[step - 1] || "Registration"}</h4>
              <small className="text-muted">Step {step} of {maxSteps}</small>
            </div>
            <div className="progress" style={{ height: "4px" }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${(step / maxSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* STEP 1 */}
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
                <Link
                  to="/login"
                  className={`fw-semibold text-decoration-none ${theme === "dark" ? "text-info" : "text-success"
                    }`}
                >
                  Login
                </Link>
              </p>
            </>
          )}

          {/* STEP 2 - Role Selection */}
          {step === 2 && (
            <div className="mb-4">
              <div className="d-flex gap-3 mb-4">
                {["client", "freelancer"].map((r) => (
                  <div
                    key={r}
                    className={`flex-fill p-4 border rounded-3 text-center cursor-pointer transition-all ${watch("role") === r ? "border-success bg-success bg-opacity-10 shadow-sm" : "border-2"
                      }`}
                    role="button"
                    onClick={() => setValue("role", r)}
                    style={{ cursor: "pointer" }}
                  >
                    <h5 className="fw-semibold text-success mb-1 text-capitalize">{r}</h5>
                    <small className="text-muted">
                      {r === "client" ? "Hire freelancers" : "Offer services"}
                    </small>
                  </div>
                ))}
              </div>

              {watch("role") === "client" && (
                <div className="alert alert-info text-center">
                  <h6 className="fw-semibold mb-2">🎉 Almost Done!</h6>
                  <p className="mb-0 small">
                    As a client, you're ready to start hiring freelancers.
                    Click "Create Profile" to complete your registration.
                  </p>
                </div>
              )}

              {watch("role") === "freelancer" && (
                <div className="alert alert-info text-center">
                  <h6 className="fw-semibold mb-2">📝 Let's Build Your Profile</h6>
                  <p className="mb-0 small">
                    We'll need some additional information to create your freelancer profile.
                    This helps clients find and hire you.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* FREELANCER STEPS 3–11 (Only show if freelancer is selected) */}
          {watch("role") === "freelancer" && step >= 3 && step <= 11 && (
            <>

              {step === 3 && (
                <div className="mb-4">
                  <p className="mb-3 fw-semibold">Have you freelanced before?</p>
                  {["I am brand new", "I have some experience", "I am an expert"].map((t) => (
                    <div
                      key={t}
                      className={`border rounded-3 p-3 mb-2 cursor-pointer transition-all ${watch("experienceLevel") === t ? "border-success bg-success bg-opacity-10 shadow-sm" : ""
                        }`}
                      role="button"
                      onClick={() => setValue("experienceLevel", t)}
                      style={{ cursor: "pointer" }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div>
                  <p>What’s your biggest goal for freelancing?</p>
                  {[
                    "To earn my main income",
                    "To make money on the side",
                    "To get experience for a full-time job",
                    "I don't have a goal in mind yet",
                  ].map((t) => (
                    <div
                      key={t}
                      className={`border rounded-3 p-3 mb-2 ${watch("goal") === t ? "border-success bg-success bg-opacity-10" : ""
                        }`}
                      role="button"
                      onClick={() => setValue("goal", t)}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              )}

              {step === 5 && (
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

              {step === 6 && (
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
                      <small className="text-muted mt-1 d-block">Accepted formats: PDF, DOC, DOCX (Max 5MB)</small>
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

              {step === 7 && (
                <div className="mb-4">
                  <label className="fw-semibold mb-3 d-block">Work Experience *</label>
                  <input className="form-control mb-3 rounded-3" placeholder="Company Name *" {...register("companyName")} />
                  <input className="form-control mb-3 rounded-3" placeholder="Role / Designation *" {...register("companyRole")} />
                  <input type="number" className="form-control rounded-3" placeholder="Years of Experience *" {...register("experienceYears")} />
                </div>
              )}

              {step === 8 && (
                <div className="mb-4">
                  <label className="fw-semibold mb-3 d-block">Education *</label>
                  <input className="form-control mb-3 rounded-3" placeholder="Degree Name * (e.g., B.Tech, MBA, High School)" {...register("degreeName")} />
                  <div className="row">
                    <div className="col">
                      <input type="number" className="form-control rounded-3" placeholder="Start Year *" {...register("startYear")} />
                    </div>
                    <div className="col">
                      <input type="text" className="form-control rounded-3" placeholder="End Year or 'Present' *" {...register("endYear")} />
                    </div>
                  </div>
                </div>
              )}

              {step === 9 && (
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
                        onChange={(e) => updateLanguageLevel(i, e.target.value)}
                      >
                        <option value="">Select Level</option>
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Professional</option>
                        <option>Fluent</option>
                        <option>Native</option>
                      </select>
                      {languages.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeLanguage(l.id)}
                          title="Remove language"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm mt-2"
                    onClick={addLanguage}
                  >
                    + Add Language
                  </button>
                </div>
              )}

              {step === 10 && (
                <div className="mb-4">
                  <label className="fw-semibold mb-2 d-block">Bio (50–5000 words) *</label>
                  <textarea
                    className="form-control mb-2"
                    rows="6"
                    placeholder="Tell the world about yourself, your skills, and experience..."
                    {...register("bio")}
                  />
                  <small className={`text-muted ${bio.trim().split(/\s+/).filter(Boolean).length < 50 ? 'text-danger' : 'text-success'}`}>
                    Word count: {bio.trim().split(/\s+/).filter(Boolean).length} / 50 minimum
                  </small>
                </div>
              )}

              {step === 11 && (
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
                  <small className="text-muted mt-1 d-block">Set a competitive rate based on your skills and experience</small>


                </div>
              )}

            </>
          )}

          {/* Centralized Navigation Controller */}
          <NavigationController />
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────────────
export default function Register() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6LfNDPYrAAAAAHBlsUWPNx1q7blEyzkK4BPptf_P">
      <RegisterCore />
    </GoogleReCaptchaProvider>
  );
}