import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function FreelancerDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
        fetchJobs();
    }, []);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data.user);
        } catch (err) {
            console.error("Failed to fetch user:", err);
        }
    };

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/jobs/active", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setJobs(res.data.jobs || []);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatBudget = (budget) => {
        if (budget.min && budget.max) {
            return `$${budget.min} - $${budget.max}`;
        } else if (budget.min) {
            return `$${budget.min}+`;
        } else if (budget.max) {
            return `Up to $${budget.max}`;
        }
        return "Budget not specified";
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const posted = new Date(date);
        const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Just posted";
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="card p-4 mb-4" style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee" }}>
                        <h4 className="mb-2" style={{ color: "#0F9D58" }}>Freelancer Dashboard</h4>
                        <p className="text-muted">Welcome back, {user?.firstName || 'Freelancer'}! Find your next opportunity.</p>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-4 mb-3">
                    <div className="card h-100" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <span style={{ fontSize: "2rem" }}>🔎</span>
                            </div>
                            <h5>Find Work</h5>
                            <p className="text-muted">Browse all available projects and opportunities</p>
                            <button
                                className="btn btn-success"
                                onClick={() => navigate("/freelancer/find-work")}
                            >
                                Browse Jobs
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card h-100" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <span style={{ fontSize: "2rem" }}>📝</span>
                            </div>
                            <h5>My Proposals</h5>
                            <p className="text-muted">Track your submitted proposals and applications</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate("/freelancer/proposals")}
                            >
                                View Proposals
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card h-100" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <span style={{ fontSize: "2rem" }}>👤</span>
                            </div>
                            <h5>My Profile</h5>
                            <p className="text-muted">Update your skills, portfolio, and settings</p>
                            <button
                                className="btn btn-info"
                                onClick={() => navigate("/freelancer/profileF")}
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Latest Job Opportunities</h5>
                            <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => navigate("/freelancer/find-work")}
                            >
                                View All Jobs
                            </button>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-success" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-4">
                                    <span style={{ fontSize: "3rem" }}>📋</span>
                                    <h6 className="mt-2">No jobs available yet</h6>
                                    <p className="text-muted">Check back later for new opportunities!</p>
                                </div>
                            ) : (
                                <div className="row">
                                    {jobs.slice(0, 3).map((job) => (
                                        <div key={job._id} className="col-md-4 mb-3">
                                            <div className="card h-100" style={{ border: "1px solid #e9ecef" }}>
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="card-title text-truncate" style={{ maxWidth: "200px" }}>
                                                            {job.title}
                                                        </h6>
                                                        <small className="text-muted">{getTimeAgo(job.createdAt)}</small>
                                                    </div>
                                                    <p className="card-text text-muted small" style={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                        overflow: "hidden"
                                                    }}>
                                                        {job.description}
                                                    </p>
                                                    <div className="mb-2">
                                                        <small className="text-success fw-semibold">
                                                            {formatBudget(job.budget)}
                                                        </small>
                                                    </div>
                                                    <div className="mb-2">
                                                        {job.roles.slice(0, 2).map((role, idx) => (
                                                            <span key={idx} className="badge bg-light text-dark me-1 mb-1">
                                                                {role.title}
                                                            </span>
                                                        ))}
                                                        {job.roles.length > 2 && (
                                                            <span className="badge bg-light text-dark">+{job.roles.length - 2} more</span>
                                                        )}
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small className="text-muted">
                                                            by {job.clientName}
                                                        </small>
                                                        <button
                                                            className="btn btn-outline-success btn-sm"
                                                            onClick={() => navigate("/freelancer/find-work")}
                                                        >
                                                            View Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-md-6 mb-3">
                    <div className="card" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body">
                            <h5 className="card-title">Active Contracts</h5>
                            <p className="text-muted">Your ongoing projects and contracts</p>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => navigate("/freelancer/contractF")}
                            >
                                View Contracts
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-3">
                    <div className="card" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body">
                            <h5 className="card-title">Messages</h5>
                            <p className="text-muted">Stay connected with your clients</p>
                            <button
                                className="btn btn-outline-success"
                                onClick={() => navigate("/freelancer/messagesF")}
                            >
                                View Messages
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}