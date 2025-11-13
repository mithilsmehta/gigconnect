import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProposalsReceived() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [freelancerProfile, setFreelancerProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [viewingFullProfile, setViewingFullProfile] = useState(false);

    useEffect(() => {
        fetchClientJobs();
    }, []);

    const fetchClientJobs = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/jobs/my-jobs", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setJobs(res.data.jobs || []);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
            toast.error("Failed to load your jobs");
        } finally {
            setLoading(false);
        }
    };

    const fetchFreelancerProfile = async (freelancerId) => {
        setLoadingProfile(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`http://localhost:5000/api/auth/user/${freelancerId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFreelancerProfile(res.data.user);
        } catch (err) {
            console.error("Failed to fetch freelancer profile:", err);
            toast.error("Failed to load freelancer profile");
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleViewProposal = (job, application) => {
        setSelectedProposal({ job, application });
        fetchFreelancerProfile(application.freelancerId);
    };

    const closeModal = () => {
        setSelectedProposal(null);
        setFreelancerProfile(null);
    };

    const formatBudget = (budget) => {
        if (budget.type === 'hourly') {
            return `$${budget.amount}/hr`;
        } else if (budget.amount) {
            return `$${budget.amount}`;
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

    const handleAcceptProposal = async (jobId, applicationId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`http://localhost:5000/api/jobs/${jobId}/applications/${applicationId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Proposal accepted!");
            closeModal();
            fetchClientJobs(); // Refresh data
        } catch (err) {
            toast.error("Failed to accept proposal");
        }
    };

    const handleRejectProposal = async (jobId, applicationId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`http://localhost:5000/api/jobs/${jobId}/applications/${applicationId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Proposal rejected");
            closeModal();
            fetchClientJobs(); // Refresh data
        } catch (err) {
            toast.error("Failed to reject proposal");
        }
    };

    const handleStartChat = async (freelancerId, jobId, jobTitle) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                'http://localhost:5000/api/messages/conversation',
                {
                    otherUserId: freelancerId,
                    jobId,
                    jobTitle,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Opening chat...");
            navigate('/client/messages');
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
                    <p className="mt-2">Loading your jobs and proposals...</p>
                </div>
            </div>
        );
    }

    const jobsWithApplications = jobs.filter(job => job.applications && job.applications.length > 0);

    return (
        <div className="container py-4">
            <ToastContainer position="top-right" />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">Proposals Received</h3>
                <span className="badge bg-info fs-6">
                    {jobsWithApplications.reduce((total, job) => total + job.applications.length, 0)} total proposals
                </span>
            </div>

            {jobsWithApplications.length === 0 ? (
                <div className="text-center py-5">
                    <span style={{ fontSize: "4rem" }}>📨</span>
                    <h4 className="mt-3">No proposals yet</h4>
                    <p className="text-muted">
                        {jobs.length === 0
                            ? "Post your first job to start receiving proposals!"
                            : "Your posted jobs haven't received any proposals yet."
                        }
                    </p>
                </div>
            ) : (
                <div className="row g-4">
                    {jobsWithApplications.map(job => (
                        <div key={job._id} className="col-12">
                            <div className="card shadow-sm" style={{ borderRadius: 12 }}>
                                <div className="card-header bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-1">{job.title}</h5>
                                            <small className="text-muted">
                                                Posted {getTimeAgo(job.createdAt)} • {formatBudget(job.budget)} • {job.applications.length} proposals
                                            </small>
                                        </div>
                                        <span className={`badge ${job.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row g-3">
                                        {job.applications.map((application, idx) => (
                                            <div key={application._id || idx} className="col-lg-6">
                                                <div className={`card h-100 ${application.status === 'accepted' ? 'border-success' :
                                                    application.status === 'rejected' ? 'border-danger' :
                                                        'border-light'
                                                    }`}>
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h6 className="card-title mb-0">
                                                                Freelancer Application
                                                            </h6>
                                                            <span className={`badge ${application.status === 'accepted' ? 'bg-success' :
                                                                application.status === 'rejected' ? 'bg-danger' :
                                                                    'bg-warning'
                                                                }`}>
                                                                {application.status}
                                                            </span>
                                                        </div>
                                                        <small className="text-muted">
                                                            Applied {getTimeAgo(application.appliedAt)}
                                                        </small>
                                                        <div className="mt-3">
                                                            <p className="card-text" style={{
                                                                fontSize: "0.9rem",
                                                                maxHeight: "80px",
                                                                overflowY: "auto"
                                                            }}>
                                                                {application.proposal?.substring(0, 150) || "No proposal message provided."}
                                                                {application.proposal?.length > 150 && "..."}
                                                            </p>
                                                        </div>
                                                        <div className="d-flex gap-2 mt-3">
                                                            <button
                                                                className="btn btn-outline-primary btn-sm flex-fill"
                                                                onClick={() => handleViewProposal(job, application)}
                                                            >
                                                                View Full Proposal
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Proposal Detail Modal */}
            {selectedProposal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Proposal Details</h5>
                                <button type="button" className="btn-close" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {/* Job Info */}
                                <div className="mb-4">
                                    <h6 className="text-muted">Job</h6>
                                    <h5>{selectedProposal.job.title}</h5>
                                    <p className="text-muted">{selectedProposal.job.description}</p>
                                </div>

                                <hr />

                                {/* Proposal */}
                                <div className="mb-4">
                                    <h6 className="text-muted">Proposal</h6>
                                    <p style={{ whiteSpace: "pre-wrap" }}>
                                        {selectedProposal.application.proposal || "No proposal message provided."}
                                    </p>
                                    <small className="text-muted">
                                        Submitted {getTimeAgo(selectedProposal.application.appliedAt)}
                                    </small>
                                </div>

                                <hr />

                                {/* Freelancer Profile */}
                                <div>
                                    <h6 className="text-muted mb-3">Freelancer Profile</h6>
                                    {loadingProfile ? (
                                        <div className="text-center py-3">
                                            <div className="spinner-border spinner-border-sm" role="status"></div>
                                            <p className="mt-2 small">Loading profile...</p>
                                        </div>
                                    ) : freelancerProfile ? (
                                        <div>
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ width: 60, height: 60, fontSize: "1.5rem" }}>
                                                    {freelancerProfile.firstName?.[0]}{freelancerProfile.lastName?.[0]}
                                                </div>
                                                <div className="ms-3">
                                                    <h5 className="mb-0">{freelancerProfile.firstName} {freelancerProfile.lastName}</h5>
                                                    <p className="text-muted mb-0">{freelancerProfile.email}</p>
                                                    {freelancerProfile.hourlyRate > 0 && (
                                                        <p className="text-success mb-0">${freelancerProfile.hourlyRate}/hr</p>
                                                    )}
                                                </div>
                                            </div>

                                            {freelancerProfile.about && (
                                                <div className="mb-3">
                                                    <strong>About:</strong>
                                                    <p className="mt-1">{freelancerProfile.about}</p>
                                                </div>
                                            )}

                                            {freelancerProfile.skills && freelancerProfile.skills.length > 0 && (
                                                <div className="mb-3">
                                                    <strong>Skills:</strong>
                                                    <div className="d-flex flex-wrap gap-1 mt-2">
                                                        {freelancerProfile.skills.map((skill, idx) => (
                                                            <span key={idx} className="badge bg-light text-dark border">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {freelancerProfile.experiences && freelancerProfile.experiences.length > 0 && (
                                                <div>
                                                    <strong>Experience:</strong>
                                                    <div className="mt-2">
                                                        {freelancerProfile.experiences.map((exp, idx) => (
                                                            <div key={idx} className="mb-2 p-2 border-start border-3 border-success ps-3">
                                                                <strong>{exp.title}</strong> at {exp.company}
                                                                <br />
                                                                <small className="text-muted">
                                                                    {exp.startYear} - {exp.present ? 'Present' : exp.endYear}
                                                                </small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-muted">Unable to load freelancer profile</p>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={() => handleStartChat(
                                        selectedProposal.application.freelancerId,
                                        selectedProposal.job._id,
                                        selectedProposal.job.title
                                    )}
                                >
                                    💬 Start Chat
                                </button>
                                <button
                                    className="btn btn-outline-info"
                                    onClick={() => setViewingFullProfile(true)}
                                >
                                    👤 View Full Profile
                                </button>
                                {selectedProposal.application.status === 'pending' && (
                                    <>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleRejectProposal(selectedProposal.job._id, selectedProposal.application._id)}
                                        >
                                            Reject
                                        </button>
                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleAcceptProposal(selectedProposal.job._id, selectedProposal.application._id)}
                                        >
                                            Accept Proposal
                                        </button>
                                    </>
                                )}
                                {selectedProposal.application.status !== 'pending' && (
                                    <button className="btn btn-secondary" onClick={closeModal}>
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Profile Modal */}
            {viewingFullProfile && freelancerProfile && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">Freelancer Profile</h5>
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
                                        className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: 100, height: 100, fontSize: '2.5rem' }}
                                    >
                                        {freelancerProfile.firstName?.[0]}{freelancerProfile.lastName?.[0]}
                                    </div>
                                    <h3>{freelancerProfile.firstName} {freelancerProfile.lastName}</h3>
                                    <p className="text-muted">{freelancerProfile.email}</p>
                                    {freelancerProfile.phone && (
                                        <p className="text-muted">📞 {freelancerProfile.phone}</p>
                                    )}
                                    {freelancerProfile.country && (
                                        <p className="text-muted">📍 {freelancerProfile.country}</p>
                                    )}
                                    {freelancerProfile.hourlyRate > 0 && (
                                        <h4 className="text-success">${freelancerProfile.hourlyRate}/hr</h4>
                                    )}
                                </div>

                                <hr />

                                {/* About */}
                                {freelancerProfile.about && (
                                    <div className="mb-4">
                                        <h5 className="text-success">About</h5>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{freelancerProfile.about}</p>
                                    </div>
                                )}

                                {/* Skills */}
                                {freelancerProfile.skills && freelancerProfile.skills.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-success">Skills</h5>
                                        <div className="d-flex flex-wrap gap-2">
                                            {freelancerProfile.skills.map((skill, idx) => (
                                                <span key={idx} className="badge bg-success" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Experience */}
                                {freelancerProfile.experiences && freelancerProfile.experiences.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-success">Work Experience</h5>
                                        {freelancerProfile.experiences.map((exp, idx) => (
                                            <div key={idx} className="card mb-3">
                                                <div className="card-body">
                                                    <h6 className="card-title">{exp.title}</h6>
                                                    <p className="card-subtitle mb-2 text-muted">{exp.company}</p>
                                                    <p className="small text-muted">
                                                        {exp.startYear} - {exp.present ? 'Present' : exp.endYear}
                                                        {exp.type && ` • ${exp.type}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Additional Info */}
                                <div className="mb-4">
                                    <h5 className="text-success">Additional Information</h5>
                                    <p><strong>Role:</strong> {freelancerProfile.role}</p>
                                    <p><strong>Member Since:</strong> {new Date(freelancerProfile.createdAt).toLocaleDateString()}</p>
                                    <p><strong>Verified:</strong> {freelancerProfile.isVerified ? '✅ Yes' : '❌ No'}</p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-success"
                                    onClick={() => {
                                        setViewingFullProfile(false);
                                        handleStartChat(
                                            selectedProposal.application.freelancerId,
                                            selectedProposal.job._id,
                                            selectedProposal.job.title
                                        );
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
