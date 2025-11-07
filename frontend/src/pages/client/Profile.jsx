import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiUser, FiMail, FiSettings, FiSun, FiMoon, FiEdit3, FiSave, FiLogOut, FiBriefcase } from "react-icons/fi";

const countryCodes = [
    { code: "+1", label: "United States", flag: "🇺🇸" },
    { code: "+44", label: "United Kingdom", flag: "🇬🇧" },
    { code: "+91", label: "India", flag: "🇮🇳" },
    { code: "+61", label: "Australia", flag: "🇦🇺" },
    { code: "+971", label: "UAE", flag: "🇦🇪" },
    { code: "+49", label: "Germany", flag: "🇩🇪" },
    { code: "+33", label: "France", flag: "🇫🇷" },
    { code: "+81", label: "Japan", flag: "🇯🇵" },
    { code: "+55", label: "Brazil", flag: "🇧🇷" },
    { code: "+86", label: "China", flag: "🇨🇳" },
];

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);

    const [basic, setBasic] = useState({
        firstName: "",
        lastName: "",
        countryCode: "+91",
        phone: "",
        country: "",
        about: "",
        companyName: "",
        industry: "",
    });

    useEffect(() => {
        fetchProfile();
        document.documentElement.setAttribute("data-theme", theme);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const u = res.data.user;
            setUser(u);

            // Clean phone number by removing country code digits
            const cleanPhone = (phone, countryCode) => {
                if (!phone) return "";
                const phoneStr = String(phone);
                const codeDigits = countryCode.replace("+", "");

                // If phone starts with country code digits, remove them
                if (phoneStr.startsWith(codeDigits)) {
                    return phoneStr.substring(codeDigits.length);
                }
                return phoneStr;
            };

            setBasic({
                firstName: u.firstName || "",
                lastName: u.lastName || "",
                countryCode: u.countryCode || "+91",
                phone: cleanPhone(u.phone, u.countryCode || "+91"),
                country: u.country || "",
                about: u.about || "",
                companyName: u.companyName || "",
                industry: u.industry || "",
            });
        } catch {
            toast.error("Failed to load profile");
        }
    };

    const saveBasic = async () => {
        try {
            setLoading(true);
            await axios.patch("http://localhost:5000/api/auth/update-basic", basic, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            toast.success("Profile updated successfully!");
            fetchProfile(); // Refresh profile data
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    return (
        <div className={`min-vh-100 ${theme === "dark" ? "bg-dark" : "bg-light"}`}>
            <div className="container py-4" style={{ maxWidth: 900 }}>
                <ToastContainer position="top-right" theme={theme} />

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <button
                        className={`btn ${theme === "dark" ? "btn-outline-light" : "btn-outline-secondary"}`}
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                    <h2 className={`fw-bold mb-0 ${theme === "dark" ? "text-light" : "text-dark"}`}>
                        My Profile
                    </h2>
                    <button
                        className={`btn ${theme === "dark" ? "btn-outline-warning" : "btn-outline-primary"}`}
                        onClick={toggleTheme}
                    >
                        {theme === "light" ? <FiMoon /> : <FiSun />}
                    </button>
                </div>

                {user && (
                    <>
                        {/* Profile Header Card */}
                        <div className={`card shadow-sm mb-4 ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}>
                            <div className="card-body text-center py-4">
                                <div className="mb-3">
                                    <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${theme === "dark" ? "bg-info" : "bg-info"}`}
                                        style={{ width: 80, height: 80, fontSize: "2rem" }}>
                                        <FiBriefcase className="text-white" />
                                    </div>
                                </div>
                                <h4 className="fw-bold mb-1">{user.firstName} {user.lastName}</h4>
                                <p className={`mb-2 ${theme === "dark" ? "text-light" : "text-muted"}`}>
                                    <FiMail className="me-2" />{user.email}
                                </p>
                                <span className={`badge ${theme === "dark" ? "bg-info" : "bg-info"} fs-6`}>
                                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="mb-4">
                            <ul className="nav nav-pills justify-content-center">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === "profile" ? "active" : ""} ${theme === "dark" ? "text-light" : ""}`}
                                        onClick={() => setActiveTab("profile")}
                                    >
                                        <FiUser className="me-2" />Profile
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === "settings" ? "active" : ""} ${theme === "dark" ? "text-light" : ""}`}
                                        onClick={() => setActiveTab("settings")}
                                    >
                                        <FiSettings className="me-2" />Settings
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <div className="row justify-content-center">
                                <div className="col-md-10">
                                    <div className={`card shadow-sm ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}>
                                        <div className="card-header">
                                            <h5 className="mb-0"><FiEdit3 className="me-2" />Personal Information</h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">First Name</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                                                        value={basic.firstName}
                                                        onChange={(e) => setBasic({ ...basic, firstName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">Last Name</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                                                        value={basic.lastName}
                                                        onChange={(e) => setBasic({ ...basic, lastName: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-md-4 mb-3">
                                                    <label className="form-label fw-semibold">Country Code</label>
                                                    <select
                                                        className={`form-select ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                                                        value={basic.countryCode}
                                                        disabled
                                                    >
                                                        {countryCodes.map((c) => (
                                                            <option key={c.code} value={c.code}>
                                                                {c.flag} {c.code} {c.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-md-8 mb-3">
                                                    <label className="form-label fw-semibold">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        className={`form-control ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                                                        value={basic.phone}
                                                        disabled
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold">Country</label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                                                    value={basic.country}
                                                    onChange={(e) => setBasic({ ...basic, country: e.target.value })}
                                                />
                                            </div>

                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">Company Name</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                                                        value={basic.companyName}
                                                        onChange={(e) => setBasic({ ...basic, companyName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-semibold">Industry</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                                                        placeholder="Technology, Healthcare, etc."
                                                        value={basic.industry}
                                                        onChange={(e) => setBasic({ ...basic, industry: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label fw-semibold">About</label>
                                                <textarea
                                                    className={`form-control ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}
                                                    rows="4"
                                                    placeholder="Tell us about your company and projects..."
                                                    value={basic.about}
                                                    onChange={(e) => setBasic({ ...basic, about: e.target.value })}
                                                />
                                            </div>

                                            <button
                                                className="btn btn-success fw-semibold w-100"
                                                onClick={saveBasic}
                                                disabled={loading}
                                            >
                                                <FiSave className="me-2" />
                                                {loading ? "Saving..." : "Save Profile"}
                                            </button>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === "settings" && (
                            <div className="row justify-content-center">
                                <div className="col-md-6">
                                    <div className={`card shadow-sm ${theme === "dark" ? "bg-dark text-light border-secondary" : ""}`}>
                                        <div className="card-header">
                                            <h5 className="mb-0"><FiSettings className="me-2" />Settings</h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <div>
                                                    <h6 className="mb-1">Theme</h6>
                                                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                                        Choose your preferred theme
                                                    </small>
                                                </div>
                                                <button
                                                    className={`btn ${theme === "dark" ? "btn-outline-warning" : "btn-outline-primary"}`}
                                                    onClick={toggleTheme}
                                                >
                                                    {theme === "light" ? <><FiMoon className="me-2" />Dark</> : <><FiSun className="me-2" />Light</>}
                                                </button>
                                            </div>

                                            <hr />

                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <div>
                                                    <h6 className="mb-1">Change Email</h6>
                                                    <small className={theme === "dark" ? "text-light" : "text-muted"}>
                                                        Update your email address
                                                    </small>
                                                </div>
                                                <button
                                                    className="btn btn-outline-primary"
                                                    onClick={() => navigate("/client/change-email")}
                                                >
                                                    <FiMail className="me-2" />Change Email
                                                </button>
                                            </div>

                                            <hr />

                                            <div className="text-center">
                                                <button
                                                    className="btn btn-danger fw-semibold"
                                                    onClick={logout}
                                                >
                                                    <FiLogOut className="me-2" />Logout
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}