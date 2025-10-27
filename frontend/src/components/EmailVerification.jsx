import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function EmailVerification({ email, onVerified }) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ⏱ Countdown logic
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // 📩 Resend OTP
  const handleResend = async () => {
    try {
      setCanResend(false);
      setTimer(30);
      setLoading(true);

      await axios.post("http://localhost:5000/api/auth/send-otp", { email });
      toast.success("A new OTP has been sent to your email!");
    } catch {
      toast.error("Failed to resend OTP. Please try again.");
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify OTP
  const handleVerify = async () => {
    try {
      if (!otp || otp.length !== 6) {
        toast.error("Enter a 6-digit OTP");
        return;
      }
      setVerifying(true);

      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });

      toast.success(res.data.message || "Email verified!");
      onVerified?.(); // callback to parent on success
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="card shadow p-4 rounded-4 border-0 text-center"
      style={{ width: 400, margin: "0 auto" }}
    >
      <h4 className="fw-bold text-success mb-3">Email Verification</h4>
      <p className="small mb-3">
        We’ve sent a 6-digit code to <b>{email}</b>. Enter it below to verify your email.
      </p>

      <input
        type="text"
        className="form-control text-center rounded-3 mb-3"
        placeholder="Enter OTP"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
      />

      <button
        className="btn btn-success w-100 fw-semibold mb-2"
        onClick={handleVerify}
        disabled={verifying}
      >
        {verifying ? "Verifying..." : "Verify Email ✅"}
      </button>

      {canResend ? (
        <button
          className="btn btn-outline-primary w-100 fw-semibold"
          onClick={handleResend}
          disabled={loading}
        >
          {loading ? "Sending..." : "Resend OTP 🔄"}
        </button>
      ) : (
        <p className="text-secondary mt-2">
          Resend available in <b>{timer}</b> seconds
        </p>
      )}
    </div>
  );
}