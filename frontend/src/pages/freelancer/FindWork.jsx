import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function FindWork() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [proposal, setProposal] = useState("");
    const [applying, setApplying] = useState(false);
    const [myApplications, setMyApplications] = useState([]);

    useEffect(() => {
        fetchJobs();
        fetchMyApplications();
    }, []);

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/jobs/active", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setJobs(res.data.jobs || []);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
            toast.error("Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    const fetchMyApplications = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/jobs/my-applications", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMyApplications(res.data.applications || []);
        } catch (err) {
            console.error("Failed to fetch applications:", err);
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

    const handleApply = async (jobId) => {
        if (!proposal.trim()) {
            toast.error("Please write a proposal");
            return;
        }

        setApplying(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`http://localhost:5000/api/jobs/${jobId}/apply`,
                { proposal },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Application submitted successfully!");
            setSelectedJob(null);
            setProposal("");
            fetchJobs(); // Refresh jobs
            fetchMyApplications(); // Refresh applications
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to apply");
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading available jobs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <ToastContainer position="top-right" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">Find Work</h3>
                <span className="badge bg-success fs-6">{jobs.length} jobs available</span>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-5">
                    <span style={{ fontSize: "4rem" }}>🔍</span>
                    <h4 className="mt-3">No jobs available yet</h4>
                    <p className="text-muted">Check back later for new opportunities!</p>
                </div>
            ) : (
                <div className="row g-4">
                    {jobs.map(job => (
                        <div key={job._id} className="col-lg-6">
                            <div className="card shadow-sm h-100" style={{ borderRadius: 12 }}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="card-title mb-0">{job.title}</h5>
                                        <small className="text-muted">{getTimeAgo(job.createdAt)}</small>
                                    </div>

                                    <p className="card-text text-muted mb-3" style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                    }}>
                                        {job.description}
                                    </p>

                                    <div className="mb-3">
                                        <h6 className="text-success mb-2">{formatBudget(job.budget)}</h6>
                                    </div>

                                    <div className="mb-3">
                                        <h6 className="small text-muted mb-2">Required Roles:</h6>
                                        <div className="d-flex flex-wrap gap-1">
                                            {job.roles.map((role, idx) => (
                                                <span key={idx} className="badge bg-primary">
                                                    {role.title} ({role.type})
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {job.roles.some(role => role.skills.length > 0) && (
                                        <div className="mb-3">
                                            <h6 className="small text-muted mb-2">Skills:</h6>
                                            <div className="d-flex flex-wrap gap-1">
                                                {job.roles.flatMap(role => role.skills).slice(0, 6).map((skill, idx) => (
                                                    <span key={idx} className="badge bg-light text-dark border">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-muted">
                                                Posted by <strong>{job.clientName}</strong>
                                                {job.clientCompany && <span> at {job.clientCompany}</span>}
                                            </small>
                                            <br />
                                            <small className="text-muted">
                                                {job.applications?.length || 0} applications
                                            </small>
                                        </div>
                                        <button
                                            className="btn btn-success"
                                            onClick={() => setSelectedJob(job)}
                                            disabled={myApplications.some(app => app.jobId === job._id)}
                                        >
                                            {myApplications.some(app => app.jobId === job._id)
                                                ? "Applied"
                                                : "Apply Now"
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Application Modal */}
            {selectedJob && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Apply to: {selectedJob.title}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedJob(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <p><strong>Client:</strong> {selectedJob.clientName}</p>
                                    <p><strong>Budget:</strong> {formatBudget(selectedJob.budget)}</p>
                                    <p><strong>Description:</strong></p>
                                    <p className="text-muted">{selectedJob.description}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Your Proposal *</label>
                                    <textarea
                                        className="form-control"
                                        rows="6"
                                        placeholder="Write a compelling proposal explaining why you're the best fit for this project..."
                                        value={proposal}
                                        onChange={(e) => setProposal(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedJob(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => handleApply(selectedJob._id)}
                                    disabled={applying || !proposal.trim()}
                                >
                                    {applying ? "Submitting..." : "Submit Proposal"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}