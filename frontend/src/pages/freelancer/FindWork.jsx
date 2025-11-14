import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getConnectBalance } from "../../api/connectAPI";

export default function FindWork() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [proposal, setProposal] = useState("");
    const [applying, setApplying] = useState(false);
    const [myApplications, setMyApplications] = useState([]);
    const [clientProfile, setClientProfile] = useState(null);
    const [viewingFullProfile, setViewingFullProfile] = useState(false);
    const [connects, setConnects] = useState(0);
    const [checkingConnects, setCheckingConnects] = useState(false);

    useEffect(() => {
        fetchJobs();
        fetchMyApplications();
        fetchConnects();
    }, []);

    const fetchConnects = async () => {
        try {
            const res = await getConnectBalance();
            setConnects(res.data.connects);
        } catch (err) {
            console.error('Failed to fetch connects:', err);
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

    const fetchClientProfile = async (clientId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:5000/api/auth/user/${clientId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClientProfile(res.data.user);
        } catch (err) {
            console.error("Failed to fetch client profile:", err);
        }
    };

    const formatBudget = (budget) => {
        if (budget.type === 'hourly') {
            return `$${budget.amount}/hr`;
        } else if (budget.amount) {
            return `$${budget.amount} (Fixed)`;
        } else if (budget.min && budget.max) {
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

    const handleCheckConnectsAndApply = async (job) => {
        // Check if user has enough connects
        if (connects < 2) {
            toast.error("Insufficient connects! You need 2 connects to apply.");
            return;
        }

        // Show the application modal
        handleViewJob(job);
    };

    const handleApply = async (jobId) => {
        if (!proposal.trim()) {
            toast.error("Please write a proposal");
            return;
        }

        // Check connects again before applying
        if (connects < 2) {
            toast.error("Insufficient connects! You need 2 connects to apply.");
            return;
        }

        setApplying(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`http://localhost:5000/api/jobs/${jobId}/apply`,
                { proposal },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(response.data.message || "Application submitted successfully!");
            setSelectedJob(null);
            setClientProfile(null);
            setProposal("");
            fetchJobs();
            fetchMyApplications();
            fetchConnects(); // Refresh connects balance
        } catch (err) {
            if (err.response?.data?.needsConnects) {
                toast.error(err.response.data.message);
            } else {
                toast.error(err.response?.data?.message || "Failed to apply");
            }
        } finally {
            setApplying(false);
        }
    };

    const handleViewJob = (job) => {
        setSelectedJob(job);
        fetchClientProfile(job.clientId);
    };

    const handleStartChat = async (clientId, jobId, jobTitle) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                'http://localhost:5000/api/messages/conversation',
                {
                    otherUserId: clientId,
                    jobId,
                    jobTitle,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Opening chat...");
            navigate('/freelancer/messagesF');
        } catch (err) {
            console.error('Failed to start chat:', err);
            toast.error('Failed to start chat');
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
                <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-info fs-6">⚡ {connects} Connects</span>
                        <button
                            className="btn btn-sm btn-success"
                            onClick={() => navigate('/buy-connects')}
                            style={{ borderRadius: 20 }}
                        >
                            Buy Connects
                        </button>
                    </div>
                    <span className="badge bg-success fs-6">{jobs.length} jobs available</span>
                </div>
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
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h6 className="text-success mb-0">{formatBudget(job.budget)}</h6>
                                            {job.duration > 0 && (
                                                <span className="badge bg-info">{job.duration} days</span>
                                            )}
                                        </div>
                                    </div>

                                    {job.skills && job.skills.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="small text-muted mb-2">Skills:</h6>
                                            <div className="d-flex flex-wrap gap-1">
                                                {job.skills.slice(0, 6).map((skill, idx) => (
                                                    <span key={idx} className="badge bg-light text-dark border">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {job.workType && (
                                        <div className="mb-3">
                                            <span className="badge bg-secondary">{job.workType}</span>
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
                                        {myApplications.some(app => app.jobId === job._id) ? (
                                            <button className="btn btn-secondary" disabled>
                                                Applied ✓
                                            </button>
                                        ) : connects < 2 ? (
                                            <button
                                                className="btn btn-warning"
                                                onClick={() => navigate('/buy-connects')}
                                            >
                                                Buy Connects to Bid
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleCheckConnectsAndApply(job)}
                                            >
                                                Bid 2 Connects
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Application Modal with Client Profile */}
            {selectedJob && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Apply to: {selectedJob.title}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setSelectedJob(null);
                                        setClientProfile(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Job Details */}
                                <div className="mb-4">
                                    <h6 className="text-muted">Job Details</h6>
                                    <p><strong>Budget:</strong> {formatBudget(selectedJob.budget)}</p>
                                    {selectedJob.duration > 0 && (
                                        <p><strong>Duration:</strong> {selectedJob.duration} days</p>
                                    )}
                                    {selectedJob.workType && (
                                        <p><strong>Work Type:</strong> {selectedJob.workType}</p>
                                    )}
                                    <p><strong>Description:</strong></p>
                                    <p className="text-muted">{selectedJob.description}</p>

                                    {selectedJob.skills && selectedJob.skills.length > 0 && (
                                        <div>
                                            <strong>Required Skills:</strong>
                                            <div className="d-flex flex-wrap gap-1 mt-2">
                                                {selectedJob.skills.map((skill, idx) => (
                                                    <span key={idx} className="badge bg-light text-dark border">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <hr />

                                {/* Client Profile */}
                                <div className="mb-4">
                                    <h6 className="text-muted">Client Information</h6>
                                    {clientProfile ? (
                                        <div>
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ width: 50, height: 50, fontSize: "1.2rem" }}>
                                                    {clientProfile.firstName?.[0]}{clientProfile.lastName?.[0]}
                                                </div>
                                                <div className="ms-3">
                                                    <h6 className="mb-0">{clientProfile.firstName} {clientProfile.lastName}</h6>
                                                    {clientProfile.companyName && (
                                                        <p className="text-muted mb-0">{clientProfile.companyName}</p>
                                                    )}
                                                    <small className="text-muted">{clientProfile.email}</small>
                                                </div>
                                            </div>
                                            {clientProfile.about && (
                                                <p className="small">{clientProfile.about}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-2">
                                            <div className="spinner-border spinner-border-sm" role="status"></div>
                                            <p className="mt-2 small">Loading client info...</p>
                                        </div>
                                    )}
                                </div>

                                <hr />

                                {/* Connects Warning */}
                                {connects < 2 && (
                                    <div className="alert alert-warning" role="alert">
                                        <div className="d-flex align-items-center">
                                            <div style={{ fontSize: '2rem', marginRight: '1rem' }}>⚡</div>
                                            <div>
                                                <h6 className="alert-heading mb-1">Insufficient Connects</h6>
                                                <p className="mb-0">
                                                    You need <strong>2 connects</strong> to apply, but you only have{' '}
                                                    <strong>{connects} connects</strong>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Proposal */}
                                <div className="mb-3">
                                    <label className="form-label"><strong>Your Proposal *</strong></label>
                                    <textarea
                                        className="form-control"
                                        rows="6"
                                        placeholder="Write a compelling proposal explaining why you're the best fit for this project..."
                                        value={proposal}
                                        onChange={(e) => setProposal(e.target.value)}
                                        disabled={connects < 2}
                                    />
                                    {connects >= 2 && (
                                        <small className="text-muted">
                                            💡 Submitting this proposal will deduct 2 connects from your account
                                        </small>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => handleStartChat(selectedJob.clientId, selectedJob._id, selectedJob.title)}
                                >
                                    💬 Start Chat
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-info"
                                    onClick={() => setViewingFullProfile(true)}
                                >
                                    👤 View Client Profile
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setSelectedJob(null);
                                        setClientProfile(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                {connects < 2 ? (
                                    <button
                                        type="button"
                                        className="btn btn-warning"
                                        onClick={() => {
                                            setSelectedJob(null);
                                            navigate('/buy-connects');
                                        }}
                                    >
                                        Buy Connects to Apply
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={() => handleApply(selectedJob._id)}
                                        disabled={applying || !proposal.trim()}
                                    >
                                        {applying ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Deducting 2 Connects...
                                            </>
                                        ) : (
                                            "Submit Proposal (2 Connects)"
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Client Profile Modal */}
            {viewingFullProfile && clientProfile && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Client Profile</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setViewingFullProfile(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Profile Header */}
                                <div className="text-center mb-4">
                                    <div
                                        className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: 100, height: 100, fontSize: '2.5rem' }}
                                    >
                                        {clientProfile.firstName?.[0]}{clientProfile.lastName?.[0]}
                                    </div>
                                    <h3>{clientProfile.firstName} {clientProfile.lastName}</h3>
                                    {clientProfile.companyName && (
                                        <h5 className="text-primary">{clientProfile.companyName}</h5>
                                    )}
                                    <p className="text-muted">{clientProfile.email}</p>
                                    {clientProfile.phone && (
                                        <p className="text-muted">📞 {clientProfile.phone}</p>
                                    )}
                                    {clientProfile.country && (
                                        <p className="text-muted">📍 {clientProfile.country}</p>
                                    )}
                                </div>

                                <hr />

                                {/* About */}
                                {clientProfile.about && (
                                    <div className="mb-4">
                                        <h5 className="text-primary">About</h5>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{clientProfile.about}</p>
                                    </div>
                                )}

                                {/* Company Info */}
                                {(clientProfile.companyName || clientProfile.industry) && (
                                    <div className="mb-4">
                                        <h5 className="text-primary">Company Information</h5>
                                        {clientProfile.companyName && (
                                            <p><strong>Company:</strong> {clientProfile.companyName}</p>
                                        )}
                                        {clientProfile.industry && (
                                            <p><strong>Industry:</strong> {clientProfile.industry}</p>
                                        )}
                                    </div>
                                )}

                                {/* Skills/Interests */}
                                {clientProfile.skills && clientProfile.skills.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-primary">Areas of Interest</h5>
                                        <div className="d-flex flex-wrap gap-2">
                                            {clientProfile.skills.map((skill, idx) => (
                                                <span key={idx} className="badge bg-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Additional Info */}
                                <div className="mb-4">
                                    <h5 className="text-primary">Additional Information</h5>
                                    <p><strong>Role:</strong> {clientProfile.role}</p>
                                    <p><strong>Member Since:</strong> {new Date(clientProfile.createdAt).toLocaleDateString()}</p>
                                    <p><strong>Verified:</strong> {clientProfile.isVerified ? '✅ Yes' : '❌ No'}</p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setViewingFullProfile(false);
                                        handleStartChat(selectedJob.clientId, selectedJob._id, selectedJob.title);
                                    }}
                                >
                                    💬 Start Chat
                                </button>
                                <button className="btn btn-secondary" onClick={() => setViewingFullProfile(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
