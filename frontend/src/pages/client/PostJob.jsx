import { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PostJob() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        budgetType: "fixed",
        budgetAmount: "",
        duration: "",
        skills: "",
        workType: "remote"
    });

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const jobData = {
                title: formData.title,
                description: formData.description,
                budget: {
                    type: formData.budgetType,
                    amount: parseFloat(formData.budgetAmount) || 0
                },
                duration: parseInt(formData.duration) || 0,
                skills: formData.skills,
                workType: formData.workType
            };

            await axios.post("http://localhost:5000/api/jobs", jobData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Job posted successfully!");

            // Reset form
            setFormData({
                title: "",
                description: "",
                budgetType: "fixed",
                budgetAmount: "",
                duration: "",
                skills: "",
                workType: "remote"
            });

        } catch (error) {
            console.error("Error posting job:", error);
            toast.error(error.response?.data?.message || "Failed to post job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <ToastContainer position="top-right" />
            <h3 className="mb-3">Post a Job</h3>
            <form onSubmit={submit} className="card shadow-sm p-4">
                <div className="mb-3">
                    <label className="form-label">Project Title *</label>
                    <input
                        className="form-control"
                        placeholder="e.g., Build a responsive website"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Project Description *</label>
                    <textarea
                        className="form-control"
                        rows={6}
                        placeholder="Describe your project requirements, goals, and expectations..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <label className="form-label">Budget Type *</label>
                        <select
                            className="form-select"
                            value={formData.budgetType}
                            onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                            required
                        >
                            <option value="fixed">Fixed Price</option>
                            <option value="hourly">Hourly Rate</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">
                            {formData.budgetType === 'hourly' ? 'Hourly Rate (USD) *' : 'Total Budget (USD) *'}
                        </label>
                        <input
                            type="number"
                            min={0}
                            className="form-control"
                            placeholder={formData.budgetType === 'hourly' ? 'e.g., 50' : 'e.g., 5000'}
                            value={formData.budgetAmount}
                            onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label">Project Duration (Days) *</label>
                    <input
                        type="number"
                        min={1}
                        className="form-control"
                        placeholder="e.g., 30"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                    />
                    <small className="text-muted">How many days do you expect this project to take?</small>
                </div>

                <div className="mb-3">
                    <label className="form-label">Required Skills</label>
                    <input
                        className="form-control"
                        placeholder="e.g., React, Node.js, MongoDB (comma separated)"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    />
                </div>
                {/* 
                <div className="mb-3">
                    <label className="form-label">Work Type *</label>
                    <select
                        className="form-select"
                        value={formData.workType}
                        onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                        required
                    >
                        <option value="remote">Remote</option>
                        <option value="onsite">On-site</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div> */}

                <div className="d-flex justify-content-end mt-4">
                    <button className="btn btn-success btn-lg" type="submit" disabled={loading}>
                        {loading ? "Publishing..." : "Publish Job"}
                    </button>
                </div>
            </form>
        </div>
    );
}
