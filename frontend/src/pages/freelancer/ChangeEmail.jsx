import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiMail, FiShield, FiCheck, FiArrowLeft } from "react-icons/fi";

export default function ChangeEmail() {
    const navigate = useNavigate();
    const [stage, setStage] = useState(1);
    const [newEmail, setNewEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");
    const currentEmail = localStorage.getItem("userEmail");

    const sendOtp = async () => {
        if (!newEmail) return toast.error("Please enter new email address");
        if (newEmail === currentEmail) return toast.error("New email cannot be same as current email");

        try {
            setLoading(true);
            await axios.post("http://localhost:5000/api/auth/email-change/send-otp",
                { newEmail },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            localStorage.setItem("pendingNewEmail", newEmail);
            toast.success("OTP sent to your new email address");
            setStage(2);
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        if (!otp) return toast.error("Please enter the OTP");
        if (otp.length !== 6) return toast.error("OTP must be 6 digits");

        try {
            setLoading(true);
            await axios.post("http://localhost:5000/api/auth/email-change/verify-otp",
                { otp },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("OTP verified successfully");
            setStage(3);
        } catch (e) {
            toast.error(e.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const confirmChange = async () => {
        if (!pwd) return toast.error("Please enter your current password");

        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const pendingEmail = localStorage.getItem("pendingNewEmail");

            await axios.post("http://localhost:5000/api/auth/email-change/confirm",
                { newEmail: pendingEmail, password: pwd },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Email updated successfully!");
            localStorage.removeItem("pendingNewEmail");
            localStorage.setItem("userEmail", pendingEmail);

            setTimeout(() => {
                navigate("/freelancer/profileF");
            }, 2000);
        } catch (err) {
            console.log(err);
            toast.error(err?.response?.data?.message || "Failed to update email");
        } finally {
            setLoading(false);
        }
    };

    const getStageIcon = (stageNum) => {
        if (stage > stageNum) return <FiCheck className="text-success" />;
        if (stage === stageNum) return <div className="spinner-border spinner-border-sm text-primary" role="status"></div>;
        return <div className="bg-secondary rounded-circle" style={{ width: 20, height: 20 }}></div>;
    };

    return (
        <div className="min-vh-100 bg-light d-flex align-items-center">
            <ToastContainer position="top-right" />
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-header bg-primary text-white text-center py-4 rounded-top-4">
                                <FiMail size={48} className="mb-3" />
                                <h3 className="fw-bold mb-0">Change Email Address</h3>
                                <p className="mb-0 opacity-75">Secure email update process</p>
                            </div>

                            <div className="card-body p-4">
                                {/* Progress Steps */}
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div className="d-flex align-items-center">
                                        {getStageIcon(1)}
                                        <span className={`ms-2 ${stage >= 1 ? 'text-primary fw-semibold' : 'text-muted'}`}>
                                            New Email
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 mx-3">
                                        <hr className={stage > 1 ? 'border-success' : 'border-secondary'} />
                                    </div>
                                    <div className="d-flex align-items-center">
                                        {getStageIcon(2)}
                                        <span className={`ms-2 ${stage >= 2 ? 'text-primary fw-semibold' : 'text-muted'}`}>
                                            Verify OTP
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 mx-3">
                                        <hr className={stage > 2 ? 'border-success' : 'border-secondary'} />
                                    </div>
                                    <div className="d-flex align-items-center">
                                        {getStageIcon(3)}
                                        <span className={`ms-2 ${stage >= 3 ? 'text-primary fw-semibold' : 'text-muted'}`}>
                                            Confirm
                                        </span>
                                    </div>
                                </div>

                                {/* Current Email Display */}
                                <div className="alert alert-info d-flex align-items-center mb-4">
                                    <FiMail className="me-2" />
                                    <div>
                                        <small className="text-muted d-block">Current Email</small>
                                        <strong>{currentEmail}</strong>
                                    </div>
                                </div>

                                {/* Stage 1: Enter New Email */}
                                {stage === 1 && (
                                    <div>
                                        <h5 className="fw-bold mb-3">Enter New Email Address</h5>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">New Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control form-control-lg"
                                                placeholder="Enter your new email address"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                        <button
                                            className="btn btn-primary btn-lg w-100 fw-semibold"
                                            onClick={sendOtp}
                                            disabled={loading || !newEmail}
                                        >
                                            {loading ? "Sending OTP..." : "Send Verification Code"}
                                        </button>
                                    </div>
                                )}

                                {/* Stage 2: Verify OTP */}
                                {stage === 2 && (
                                    <div>
                                        <h5 className="fw-bold mb-3">Verify Your Email</h5>
                                        <p className="text-muted mb-3">
                                            We've sent a 6-digit verification code to <strong>{newEmail}</strong>
                                        </p>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Verification Code</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg text-center"
                                                placeholder="Enter 6-digit code"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                maxLength="6"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-secondary"
                                                onClick={() => setStage(1)}
                                                disabled={loading}
                                            >
                                                Back
                                            </button>
                                            <button
                                                className="btn btn-primary btn-lg flex-fill fw-semibold"
                                                onClick={verifyOtp}
                                                disabled={loading || otp.length !== 6}
                                            >
                                                {loading ? "Verifying..." : "Verify Code"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Stage 3: Confirm with Password */}
                                {stage === 3 && (
                                    <div>
                                        <h5 className="fw-bold mb-3">Confirm Email Change</h5>
                                        <div className="alert alert-warning d-flex align-items-center mb-3">
                                            <FiShield className="me-2" />
                                            <small>Enter your current password to confirm this change</small>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Current Password</label>
                                            <input
                                                type="password"
                                                className="form-control form-control-lg"
                                                placeholder="Enter your current password"
                                                value={pwd}
                                                onChange={(e) => setPwd(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-secondary"
                                                onClick={() => setStage(2)}
                                                disabled={loading}
                                            >
                                                Back
                                            </button>
                                            <button
                                                className="btn btn-success btn-lg flex-fill fw-semibold"
                                                onClick={confirmChange}
                                                disabled={loading || !pwd}
                                            >
                                                {loading ? "Updating..." : "Confirm Change"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Back to Profile Button */}
                                <div className="text-center mt-4">
                                    <button
                                        className="btn btn-link text-decoration-none"
                                        onClick={() => navigate(-1)}
                                        disabled={loading}
                                    >
                                        <FiArrowLeft className="me-1" />
                                        Back to Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}