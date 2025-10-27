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

// ──────────────────────────────────────────────────────────────────────────────
// Small inline component for "Resend OTP" timer
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
// ──────────────────────────────────────────────────────────────────────────────

function RegisterCore() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState("light");
  const [resumeFile, setResumeFile] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [phone, setPhone] = useState("");
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Email OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);

  const {
    register,
    watch,
    setValue,
    getValues,
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
      skills: "",
      about: "",
    },
  });

  // Password strength
  const pwd = watch("password");
  useEffect(() => {
    if (!pwd) return setPasswordStrength("");
    if (pwd.length < 6) return setPasswordStrength("Weak");
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd))
      setPasswordStrength("Strong");
    else setPasswordStrength("Medium");
  }, [pwd]);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // ────────────────────────────────────────────────────────────────────────────
  // GOOGLE SIGNUP: If user exists → take to Login. If new → autofill and skip to Step 2.
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
        // Existing account: direct login
        if (!res.data.isNew) {
          localStorage.setItem("token", res.data.token);
          toast.success("Welcome back!");
          setTimeout(() => navigate("/home"), 800);
          return;
        }

        // New Google user: prefill & mark verified, skip Step 1
        const fullName = res.data.user?.name || gUser.displayName || "";
        const [fn = "", ln = ""] = fullName.split(" ");
        setValue("firstName", fn);
        setValue("lastName", ln);
        setValue("email", res.data.user?.email || gUser.email);
        setEmailVerified(true); // trust Google email
        localStorage.setItem("token", res.data.token); // keep temp auth if needed for later
        toast.success("Google connected! Continue setup.");
        setStep(2);
      } else {
        toast.error("Google signup failed.");
      }
    } catch (err) {
      console.error("Google Register Error:", err);
      toast.error("Google signup failed.");
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  // Send Email OTP
  const sendOtp = async () => {
    try {
      const email = getValues("email");
      if (!email) return toast.error("Enter your email first");
      setOtpBusy(true);
      const res = await axios.post("http://localhost:5000/api/auth/send-otp", { email });
      toast.success(res.data.message || "Verification code sent!");
      setOtpSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP.";
      toast.error(msg);
    } finally {
      setOtpBusy(false);
    }
  };

  // Verify Email OTP
  const verifyOtp = async () => {
    try {
      const email = getValues("email");
      if (!email || !otpInput) return toast.error("Enter the 6-digit code");
      setOtpBusy(true);
      await axios.post("http://localhost:5000/api/auth/verify-otp", { email, otp: otpInput });
      toast.success("Email verified!");
      setEmailVerified(true);
      setOtpSent(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setOtpBusy(false);
    }
  };

  // Next/back
  const onNext = () => {
    const v = getValues();
    if (step === 1) {
      if (!v.firstName || !v.lastName || !v.email || !phone || !v.password || !v.confirmPassword)
        return toast.error("Please fill all fields");
      if (v.password !== v.confirmPassword) return toast.error("Passwords do not match");
      if (!emailVerified) return toast.error("Please verify your email first");
    }
    if (step === 2 && !v.role) return toast.error("Please select your role");
    setStep((s) => s + 1);
  };
  const onBack = () => setStep((s) => Math.max(1, s - 1));

  // Final submit
  const onSubmit = async (skipResume = false) => {
    try {
      if (!executeRecaptcha) return toast.error("reCAPTCHA not ready");
      const recaptchaToken = await executeRecaptcha("register");
      const v = getValues();

      const formData = new FormData();
      Object.entries({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        password: v.password,
        confirmPassword: v.confirmPassword,
        role: v.role,
        skills: v.skills || "",
        about: v.about || "",
        phone,
        recaptchaToken,
      }).forEach(([k, val]) => formData.append(k, val));

      if (!skipResume && resumeFile) formData.append("resume", resumeFile);

      await axios.post("http://localhost:5000/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (e) {
      toast.error(e.response?.data?.message || "Registration failed");
    }
  };

  const fade = { animation: "fade .35s ease" };
  const keyframes = `@keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`;

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

      <div className="d-flex align-items-center justify-content-center vh-100">
        <div
          className={`card shadow-lg p-4 rounded-4 border-0 ${
            theme === "dark" ? "bg-dark text-light" : "bg-light"
          }`}
          style={{ width: 540, ...fade }}
        >
          <h3 className="text-center text-success fw-bold mb-3">
            {["Create Account", "Choose Role", "Profile Details", "Upload Resume"][step - 1]}
          </h3>

          {/* Progress */}
          <div className="mb-4">
            <div className="progress">
              <div className="progress-bar bg-success" style={{ width: `${step * 25}%` }} />
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              {/* Google first */}
              <div className="d-flex align-items-center justify-content-center mb-3">
                <button
                  type="button"
                  onClick={googleSignup}
                  className="btn d-flex align-items-center justify-content-center gap-2 w-100 border rounded-3"
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #dadce0",
                    height: "45px",
                    fontWeight: "500",
                  }}
                >
                  <FcGoogle size={22} />
                  <span style={{ color: "#3c4043" }}>Continue with Google</span>
                </button>
              </div>

              <div className="d-flex align-items-center mb-3">
                <hr className="flex-grow-1" />
                <span className="mx-2 text-muted">or</span>
                <hr className="flex-grow-1" />
              </div>

              <div className="row mb-3">
                <div className="col">
                  <input
                    className="form-control rounded-3"
                    placeholder="First name"
                    {...register("firstName", { required: true })}
                  />
                </div>
                <div className="col">
                  <input
                    className="form-control rounded-3"
                    placeholder="Last name"
                    {...register("lastName", { required: true })}
                  />
                </div>
              </div>

              <input
                type="email"
                className="form-control rounded-3 mb-3"
                placeholder="Email"
                {...register("email", { required: true })}
              />

              <div className="mb-3">
                <PhoneInput
                  country={"in"}
                  value={phone}
                  onChange={setPhone}
                  inputClass="w-100"
                  inputStyle={{
                    width: "100%",
                    borderRadius: "10px",
                    border: "1px solid #ced4da",
                    height: "45px",
                  }}
                  enableSearch
                />
              </div>

              <div className="row mb-3">
                <div className="col position-relative">
                  <input
                    type="password"
                    className="form-control rounded-3"
                    placeholder="Password"
                    {...register("password", { required: true, minLength: 6 })}
                  />
                  {passwordStrength && (
                    <small
                      className={`ms-1 ${
                        passwordStrength === "Strong"
                          ? "text-success"
                          : passwordStrength === "Medium"
                          ? "text-warning"
                          : "text-danger"
                      }`}
                    >
                      {passwordStrength}
                    </small>
                  )}
                </div>
                <div className="col">
                  <input
                    type="password"
                    className="form-control rounded-3"
                    placeholder="Confirm password"
                    {...register("confirmPassword", {
                      required: true,
                      validate: (val) => val === watch("password"),
                    })}
                  />
                </div>
              </div>

              {/* Email OTP */}
              <div className="mb-3">
                {!emailVerified ? (
                  <>
                    {!otpSent ? (
                      <button
                        type="button"
                        className="btn btn-outline-primary w-100 fw-semibold"
                        onClick={sendOtp}
                        disabled={otpBusy}
                      >
                        {otpBusy ? "Sending..." : "Send Verification Code"}
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          className="form-control text-center rounded-3 my-2"
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                        />
                        <button
                          className="btn btn-success w-100"
                          type="button"
                          onClick={verifyOtp}
                          disabled={otpBusy}
                        >
                          {otpBusy ? "Verifying..." : "Verify Code ✅"}
                        </button>
                        <ResendOtpTimer onResend={sendOtp} busy={otpBusy} />
                      </>
                    )}
                  </>
                ) : (
                  <div className="alert alert-success text-center py-2 mb-0">✅ Email Verified</div>
                )}
              </div>

              <button className="btn btn-success w-100 fw-semibold" onClick={onNext}>
                Continue →
              </button>

              <p className="text-center mt-3">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className={`fw-semibold text-decoration-none ${
                    theme === "dark" ? "text-info" : "text-success"
                  }`}
                >
                  Login
                </Link>
              </p>
            </>
          )}

          {/* STEP 2 – Role */}
          {step === 2 && (
            <>
              <div className="d-flex gap-3 mb-4">
                {["client", "freelancer"].map((r) => (
                  <div
                    key={r}
                    className={`flex-fill p-3 border rounded-3 text-center ${
                      watch("role") === r ? "border-success bg-success bg-opacity-10" : ""
                    }`}
                    role="button"
                    onClick={() => setValue("role", r)}
                  >
                    <h5 className="fw-semibold text-success mb-1 text-capitalize">{r}</h5>
                    <p className="small text-muted mb-0">
                      {r === "client" ? "I want to hire freelancers" : "I want to get gigs"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between">
                <button className="btn btn-outline-secondary" onClick={onBack}>
                  ← Back
                </button>
                <button className="btn btn-success" onClick={onNext}>
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* STEP 3 – Profile details */}
          {step === 3 && (
            <>
              <input
                className="form-control rounded-3 mb-3"
                placeholder="Skills or Services (comma separated)"
                {...register("skills")}
              />
              <textarea
                className="form-control rounded-3 mb-3"
                rows="3"
                placeholder="Tell us about yourself or your requirements"
                {...register("about")}
              />
              <div className="d-flex justify-content-between">
                <button className="btn btn-outline-secondary" onClick={onBack}>
                  ← Back
                </button>
                <button className="btn btn-success" onClick={onNext}>
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* STEP 4 – Resume */}
          {step === 4 && (
            <>
              <label className="form-label fw-semibold">Upload Resume (optional)</label>
              <input
                type="file"
                className="form-control rounded-3 mb-3"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files[0] || null)}
              />

              <button className="btn btn-outline-secondary w-100 mb-2" onClick={() => onSubmit(true)}>
                Skip & Finish →
              </button>
              <button className="btn btn-success w-100 fw-semibold" onClick={() => onSubmit(false)}>
                Upload & Finish ✅
              </button>

              <div className="mt-3 text-center">
                <button className="btn btn-link text-muted" onClick={onBack}>
                  ← Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Wrap with reCAPTCHA provider
export default function Register() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6LfNDPYrAAAAAHBlsUWPNx1q7blEyzkK4BPptf_P">
      <RegisterCore />
    </GoogleReCaptchaProvider>
  );
}