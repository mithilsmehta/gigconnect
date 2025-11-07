import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ParticleBackground from "../components/ParticleBackground.jsx";
import { auth, sendPasswordResetEmail } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";

function LoginCore() {
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [form, setForm] = useState({ emailOrPhone: "", password: "", remember: false });
  const [show, setShow] = useState(false);
  const [theme, setTheme] = useState("light");
  const [forgotMode, setForgotMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🌗 Theme toggle
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // ✅ Normal login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.emailOrPhone || !form.password) {
      toast.error("Please enter both fields.");
      return;
    }

    try {
      setLoading(true);
      if (!executeRecaptcha) return toast.error("reCAPTCHA not ready");
      const recaptchaToken = await executeRecaptcha("login");

      const res = await axios.post("http://localhost:5000/api/auth/login", {
        emailOrPhone: form.emailOrPhone,
        password: form.password,
        recaptchaToken,
      });

      if (res.data.success) {
        // ⭐ store everything we need
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userRole", res.data.user.role);
        localStorage.setItem("userName", `${res.data.user.firstName} ${res.data.user.lastName}`);
        localStorage.setItem("userEmail", res.data.user.email);
        localStorage.setItem("userPhone", res.data.user.phone || "");
        localStorage.setItem("userCountry", res.data.user.country || "");

        toast.success("Login successful!");

        // ⭐ go direct to dashboard
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        toast.error(res.data.message || "Invalid credentials.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot password
  const handleForgotPassword = async () => {
    try {
      if (!form.emailOrPhone) return toast.error("Enter your email first");
      await sendPasswordResetEmail(auth, form.emailOrPhone);
      toast.success("Password reset link sent to your email!");
      setTimeout(() => setForgotMode(false), 2000);
    } catch {
      toast.error("Failed to send password reset link");
    }
  };

  // ✅ Google login (handles existing/new users)
  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const res = await axios.post("http://localhost:5000/api/auth/google-login", {
        email: user.email,
        firstName: user.displayName?.split(" ")[0],
        lastName: user.displayName?.split(" ")[1] || "",
      });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);

        if (res.data.isNew) {
          toast.info("New Google user — please complete registration.");
          setTimeout(() => navigate("/"), 1000);
        } else {
          toast.success("Welcome back!");
          setTimeout(() => navigate("/home"), 1000);
        }
      } else toast.error("Failed to login with Google");
    } catch (err) {
      console.error("Google Login Error:", err);
      toast.error("Google login failed. Please try again.");
    }
  };

  return (
    <>
      <ParticleBackground />
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
          className={`card shadow-lg p-4 rounded-4 border-0 ${theme === "dark" ? "bg-dark text-light" : "bg-light"
            }`}
          style={{ width: 420 }}
        >
          <h3 className="text-center text-success fw-bold mb-3">
            {forgotMode ? "Forgot Password" : "Login"}
          </h3>

          {forgotMode ? (
            <>
              <input
                type="email"
                className="form-control rounded-3 mb-3"
                placeholder="Enter your registered email"
                value={form.emailOrPhone}
                onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
              />
              <button className="btn btn-success w-100 fw-semibold mb-3" onClick={handleForgotPassword}>
                Send Reset Link
              </button>
              <button className="btn btn-outline-secondary w-100" onClick={() => setForgotMode(false)}>
                ← Back to Login
              </button>
            </>
          ) : (
            <form onSubmit={handleLogin}>
              <input
                type="text"
                className="form-control rounded-3 mb-3"
                placeholder="Email or Phone Number"
                value={form.emailOrPhone}
                onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
              />
              <div className="mb-2 position-relative">
                <input
                  type={show ? "text" : "password"}
                  className="form-control rounded-3"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <span
                  role="button"
                  className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
                  onClick={() => setShow((s) => !s)}
                >
                  👁️
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="remember"
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  />
                  <label className={`form-check-label ${theme === "dark" ? "text-light" : ""}`} htmlFor="remember">
                    Remember me
                  </label>
                </div>

                <button type="button" className="btn btn-link p-0" onClick={() => setForgotMode(true)}>
                  Forgot password?
                </button>
              </div>

              <button className="btn btn-success w-100 fw-semibold" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1" />
                <span className="mx-2 text-muted">or</span>
                <hr className="flex-grow-1" />
              </div>

              <button
                type="button"
                onClick={googleLogin}
                className="btn d-flex align-items-center justify-content-center gap-2 w-100 border rounded-3"
                style={{
                  backgroundColor: "white",
                  border: "1px solid #dadce0",
                  height: "45px",
                  fontWeight: "500",
                }}
              >
                <FcGoogle size={22} />
                <span style={{ color: "#3c4043" }}>Sign in with Google</span>
              </button>

              <p className="text-center mt-3 mb-0">
                Don’t have an account?{" "}
                <Link
                  to="/"
                  className={`text-decoration-none fw-semibold ${theme === "dark" ? "text-info" : "text-success"
                    }`}
                >
                  Register
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default function Login() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6LfNDPYrAAAAAHBlsUWPNx1q7blEyzkK4BPptf_P">
      <LoginCore />
    </GoogleReCaptchaProvider>
  );
}