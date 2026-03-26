import { useState, useEffect } from "react";
import axios from "axios";

const emptyForm = {
  title: "", category: "", location: "", jobType: "", package: "",
  openings: "", description: "", skills: "", deadline: "", eligibility: ""
};

function CompanyJobPosts() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const header = { headers: { "Content-type": "application/json", Authorization: `Bearer ${localStorage.getItem("companyToken")}` } };

  useEffect(() => {
    axios.get("/api/company/job-posts", header)
      .then(res => { setPosts(res.data.data || res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
    axios.get("/api/classification/job-categories", header)
      .then(res => setCategories(res.data.data || res.data || []))
      .catch(console.error);
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("/api/company/job-posts", form, header)
      .then(res => { setPosts(prev => [...prev, res.data.data || res.data]); setShowModal(false); setForm(emptyForm); })
      .catch(console.error);
  };

  const togglePost = (id, enabled) => {
    axios.patch(`/api/company/job-posts/${id}/toggle`, { enabled: !enabled }, header)
      .then(() => setPosts(prev => prev.map(p => p.id === id ? { ...p, enabled: !enabled } : p)))
      .catch(console.error);
  };

  return (
    <div className="p-4">
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Job Posts</h2>
          <p className="fs-p9 text-secondary">Post and manage your job requirements</p>
        </div>
        <button className="btn btn-primary w-auto" onClick={() => setShowModal(true)}>+ Post New Job</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="row" style={{ gap: "16px" }}>
          {posts.length === 0 ? (
            <div className="card p-5 w-100 text-center">
              <p style={{ fontSize: "3rem" }}>💼</p>
              <p className="bold mt-2">No job posts yet</p>
              <p className="text-secondary fs-p9">Click "Post New Job" to get started</p>
            </div>
          ) : posts.map(post => (
            <div key={post.id} className="card p-4 stat-card" style={{ width: "calc(48% - 16px)" }}>
              <div className="row space-between items-center mb-2">
                <h4 className="bold">{post.title}</h4>
                <span className="status-item fs-p8" style={{
                  background: post.enabled ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                  color: post.enabled ? "#16a34a" : "#dc2626"
                }}>{post.enabled ? "Active" : "Disabled"}</span>
              </div>
              <p className="fs-p9 text-secondary">{post.category} • {post.location}</p>
              <p className="fs-p9 bold text-success mt-1">{post.package} LPA</p>
              <p className="fs-p8 text-secondary mt-1">Openings: {post.openings} | Deadline: {post.deadline}</p>
              {post.skills && (
                <div className="mt-2" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {post.skills.split(",").map((s, i) => (
                    <span key={i} className="fs-p8" style={{ background: "#e5e7eb", borderRadius: "12px", padding: "2px 10px" }}>{s.trim()}</span>
                  ))}
                </div>
              )}
              <div className="row mt-3" style={{ gap: "8px" }}>
                <button className="btn btn-muted w-auto" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>Applicants ({post.applicantCount || 0})</button>
                <button
                  className={`btn ${post.enabled ? "btn-danger" : "btn-primary"} w-auto`}
                  style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                  onClick={() => togglePost(post.id, post.enabled)}
                >{post.enabled ? "Disable" : "Enable"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card p-5" style={{ width: "540px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 className="mb-4">Post New Job</h3>
            <div className="form-group mb-2">
              <label className="form-control-label">Job Title *</label>
              <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Software Engineer" />
            </div>
            <div className="row" style={{ gap: "10px" }}>
              <div className="col-6 p-0">
                <label className="form-control-label">Category</label>
                <select className="form-control" name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.categoryName || c.name}>{c.categoryName || c.name}</option>)}
                </select>
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">Job Type</label>
                <select className="form-control" name="jobType" value={form.jobType} onChange={handleChange}>
                  <option value="">Select Type</option>
                  <option>Full Time</option><option>Internship</option><option>Contract</option>
                </select>
              </div>
            </div>
            <div className="row mt-2" style={{ gap: "10px" }}>
              <div className="col-6 p-0">
                <label className="form-control-label">Package (LPA)</label>
                <input className="form-control" name="package" value={form.package} onChange={handleChange} placeholder="e.g. 8" />
              </div>
              <div className="col-6 p-0">
                <label className="form-control-label">Openings</label>
                <input className="form-control" name="openings" value={form.openings} onChange={handleChange} placeholder="e.g. 10" />
              </div>
            </div>
            <div className="form-group mt-2 mb-2">
              <label className="form-control-label">Location</label>
              <input className="form-control" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Hyderabad" />
            </div>
            <div className="form-group mb-2">
              <label className="form-control-label">Required Skills (comma separated)</label>
              <input className="form-control" name="skills" value={form.skills} onChange={handleChange} placeholder="React, Java, SQL" />
            </div>
            <div className="form-group mb-2">
              <label className="form-control-label">Eligibility (CGPA / Branch)</label>
              <input className="form-control" name="eligibility" value={form.eligibility} onChange={handleChange} placeholder="CGPA ≥ 7.5, CSE/IT/ECE" />
            </div>
            <div className="form-group mb-2">
              <label className="form-control-label">Application Deadline</label>
              <input type="date" className="form-control" name="deadline" value={form.deadline} onChange={handleChange} />
            </div>
            <div className="form-group mb-3">
              <label className="form-control-label">Job Description</label>
              <textarea className="form-control" rows="3" name="description" value={form.description} onChange={handleChange} />
            </div>
            <div className="row" style={{ gap: "10px" }}>
              <button className="btn btn-primary" onClick={handleSubmit}>Post Job</button>
              <button className="btn btn-muted" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyJobPosts;
