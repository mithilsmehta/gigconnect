import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function ClientDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUser();
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

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="card p-4 mb-4" style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee" }}>
                        <h4 className="mb-2" style={{ color: "#0F9D58" }}>Client Dashboard</h4>
                        <p className="text-muted">Welcome back, {user?.firstName || 'Client'}! Manage your projects and find talent.</p>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-4 mb-3">
                    <div className="card h-100" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <span style={{ fontSize: "2rem" }}>➕</span>
                            </div>
                            <h5>Post a Job</h5>
                            <p className="text-muted">Find the perfect freelancer for your project</p>
                            <button
                                className="btn btn-success"
                                onClick={() => navigate("/client/post-job")}
                            >
                                Post Job
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card h-100" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <span style={{ fontSize: "2rem" }}>📨</span>
                            </div>
                            <h5>View Proposals</h5>
                            <p className="text-muted">Review proposals from talented freelancers</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate("/client/proposals")}
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
                            <p className="text-muted">Update your company information and settings</p>
                            <button
                                className="btn btn-info"
                                onClick={() => navigate("/client/profile")}
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6 mb-3">
                    <div className="card" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body">
                            <h5 className="card-title">Recent Activity</h5>
                            <p className="text-muted">Your recent jobs and proposals will appear here</p>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => navigate("/client/jobs")}
                            >
                                View All Jobs
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-3">
                    <div className="card" style={{ borderRadius: 12, border: "1px solid #eee" }}>
                        <div className="card-body">
                            <h5 className="card-title">Messages</h5>
                            <p className="text-muted">Stay connected with your freelancers</p>
                            <button
                                className="btn btn-outline-success"
                                onClick={() => navigate("/client/messages")}
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