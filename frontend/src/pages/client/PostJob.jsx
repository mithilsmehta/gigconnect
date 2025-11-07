import { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PostJob() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        budget: { min: "", max: "" }
    });
    const [roles, setRoles] = useState([{ id: crypto.randomUUID(), title: "", skills: "", type: "remote" }]);

    const addRole = () => setRoles((r) => [...r, { id: crypto.randomUUID(), title: "", skills: "", type: "remote" }]);
    const updateRole = (id, field, val) => setRoles((r) => r.map(x => x.id === id ? { ...x, [field]: val } : x));
    const removeRole = (id) => setRoles((r) => r.filter(x => x.id !== id));

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const jobData = {
                title: formData.title,
                description: formData.description,
                budget: {
                    min: parseFloat(formData.budget.min) || 0,
                    max: parseFloat(formData.budget.max) || 0
                },
                roles: roles.filter(role => role.title.trim()) // Only include roles with titles
            };

            await axios.post("http://localhost:5000/api/jobs", jobData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Job posted successfully!");

            // Reset form
            setFormData({ title: "", description: "", budget: { min: "", max: "" } });
            setRoles([{ id: crypto.randomUUID(), title: "", skills: "", type: "remote" }]);

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
            <form onSubmit={submit} className="card shadow-sm p-3">
                <div className="mb-3">
                    <label className="form-label">Project Title *</label>
                    <input
                        className="form-control"
                        placeholder="e.g., Build marketing site"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Project Description *</label>
                    <textarea
                        className="form-control"
                        rows={5}
                        placeholder="Describe the scope…"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Budget (USD)</label>
                    <div className="row g-2">
                        <div className="col">
                            <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="Min"
                                value={formData.budget.min}
                                onChange={(e) => setFormData({ ...formData, budget: { ...formData.budget, min: e.target.value } })}
                            />
                        </div>
                        <div className="col">
                            <input
                                type="number"
                                min={0}
                                className="form-control"
                                placeholder="Max"
                                value={formData.budget.max}
                                onChange={(e) => setFormData({ ...formData, budget: { ...formData.budget, max: e.target.value } })}
                            />
                        </div>
                    </div>
                </div>

                <hr className="my-4" />
                <h6 className="mb-2">Roles (unlimited)</h6>

                {roles.map((r, i) => (
                    <div key={r.id} className="border rounded-3 p-3 mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>Role {i + 1}</strong>
                            {roles.length > 1 && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRole(r.id)}>Remove</button>}
                        </div>
                        <div className="row g-2">
                            <div className="col-md-4">
                                <input className="form-control" placeholder="Role title (e.g., React Dev)" value={r.title}
                                    onChange={(e) => updateRole(r.id, "title", e.target.value)} required />
                            </div>
                            <div className="col-md-6">
                                <input className="form-control" placeholder="Skills (comma separated)" value={r.skills}
                                    onChange={(e) => updateRole(r.id, "skills", e.target.value)} />
                            </div>
                            <div className="col-md-2">
                                <select className="form-select" value={r.type} onChange={(e) => updateRole(r.id, "type", e.target.value)}>
                                    <option value="remote">remote</option>
                                    <option value="onsite">onsite</option>
                                    <option value="hybrid">hybrid</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="d-flex gap-2 mt-2">
                    <button type="button" className="btn btn-outline-success btn-sm" onClick={addRole}>+ Add another role</button>
                </div>

                <div className="d-flex justify-content-end mt-4">
                    <button className="btn btn-success" type="submit" disabled={loading}>
                        {loading ? "Publishing..." : "Publish Job"}
                    </button>
                </div>
            </form>
        </div>
    );
}