import { useState, useEffect } from "react";
import axios from "axios";
const rest = require("../../../Rest");

const getToken = () => localStorage.getItem("token") || "";

// Change this at the top of the file:
const getHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

const emptyForm = {
  tiitle:             "",
  description:        "",
  requiredCandidate:  "",
  lastDateToApply:    "",
  eligiblePercentage: "",
  poster:             "",
  skillIds:           [],
};

function CompanyJobPosts() {
  const [posts, setPosts]           = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]       = useState("");
  const [msgType, setMsgType]       = useState("");
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    axios.get(rest.jobPost, getHeader())
      .then(res => {
        const list = Array.isArray(res.data.data) ? res.data.data
                   : Array.isArray(res.data)       ? res.data
                   : [];
        setPosts(list);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddSkill = () => {
    const id = parseInt(skillInput.trim());
    if (!isNaN(id) && !form.skillIds.includes(id)) {
      setForm(prev => ({ ...prev, skillIds: [...prev.skillIds, id] }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (id) => {
    setForm(prev => ({ ...prev, skillIds: prev.skillIds.filter(s => s !== id) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tiitle.trim()) {
      setMessage("Job title is required.");
      setMsgType("error");
      return;
    }
    setSubmitting(true);

    axios.post(rest.jobPost, form, getHeader())
      .then(res => {
        const newPost = res.data.data || res.data;
        setPosts(prev => [newPost, ...prev]);
        setShowModal(false);
        setForm(emptyForm);
        setSkillInput("");
        setMessage("Job posted successfully!");
        setMsgType("success");
        setTimeout(() => setMessage(""), 3000);
      })
      .catch(err => {
        console.error(err);
        setMessage(err.response?.data?.message || "Failed to post job. Try again.");
        setMsgType("error");
      })
      .finally(() => setSubmitting(false));
  };

  const StatusBadge = ({ s }) => {
    const val = (s || "ACTIVE").toUpperCase();
    const map = {
      ACTIVE:   { bg: "rgba(22,163,74,0.1)",  color: "var(--success)", label: "Active"   },
      DEACTIVE: { bg: "rgba(220,38,38,0.1)",  color: "var(--danger)",  label: "Deactive" },
      OPEN:     { bg: "rgba(22,163,74,0.1)",  color: "var(--success)", label: "Open"     },
      CLOSED:   { bg: "rgba(220,38,38,0.1)",  color: "var(--danger)",  label: "Closed"   },
    };
    const c = map[val] || { bg: "rgba(156,163,175,0.15)", color: "var(--gray-500)", label: val };
    return (
      <span style={{ padding: "4px 12px", borderRadius: "20px", fontWeight: "600",
        fontSize: "0.75rem", background: c.bg, color: c.color }}>
        {c.label}
      </span>
    );
  };

  const Row = ({ label, value }) => (
    <tr>
      <td className="text-secondary fs-p9" style={{ width: "160px", verticalAlign: "top", paddingRight: "8px" }}>{label}</td>
      <td className="fs-p9">{value || "—"}</td>
    </tr>
  );

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Job Posts</h2>
          <p className="fs-p9 text-secondary">Post and manage your job requirements</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "auto", padding: "8px 18px", borderRadius: "10px" }}
          onClick={() => { setShowModal(true); setMessage(""); setForm(emptyForm); setSkillInput(""); }}
        >
          + Post New Job
        </button>
      </div>

      {message && (
        <div className={msgType === "success" ? "alert-success mb-3" : "alert-danger mb-3"}>
          <p className="fs-p9" style={{ color: msgType === "success" ? "var(--success)" : "var(--danger)", fontWeight: "600" }}>
            {message}
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-center p-4">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="card p-5 text-center">
          <p style={{ fontSize: "3rem" }}>💼</p>
          <p className="bold mt-2">No job posts yet</p>
          <p className="text-secondary fs-p9">Click "Post New Job" to get started</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {posts.map(post => (
            <div key={post.jobPostId} className="card p-4 stat-card">

              <div className="row space-between items-center mb-2">
                <h4 className="bold fs-p9" style={{ margin: 0 }}>{post.tiitle || "Untitled"}</h4>
                <StatusBadge s={post.status} />
              </div>

              {post.companyModel && (
                <p className="fs-p8 text-secondary mb-1">
                  {post.companyModel.companyName} • {post.companyModel.location || "—"}
                </p>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "8px 0" }}>
                {post.requiredCandidate && (
                  <span className="fs-p8" style={{ background: "rgba(14,165,233,0.1)", color: "var(--info)", padding: "3px 10px", borderRadius: "12px" }}>
                    👥 {post.requiredCandidate} openings
                  </span>
                )}
                {post.eligiblePercentage && (
                  <span className="fs-p8" style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)", padding: "3px 10px", borderRadius: "12px" }}>
                    📊 {post.eligiblePercentage}% eligible
                  </span>
                )}
                {post.poster && (
                  <span className="fs-p8" style={{ background: "rgba(84,95,57,0.1)", color: "var(--secondary)", padding: "3px 10px", borderRadius: "12px" }}>
                    🏷 {post.poster}
                  </span>
                )}
              </div>

              <p className="fs-p8 text-secondary">
                Posted: {post.postedDate || "—"} &nbsp;|&nbsp; Deadline: {post.lastDateToApply || "—"}
              </p>

              {post.description && (
                <p className="fs-p8 text-secondary mt-1" style={{
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                }}>
                  {post.description}
                </p>
              )}

              <div className="row mt-3" style={{ gap: "8px" }}>
                <button
                  className="btn btn-sm btn-info"
                  style={{ width: "auto", padding: "5px 14px", borderRadius: "8px", fontSize: "12px" }}
                  onClick={() => { setSelected(post); setShowDetail(true); }}
                >
                  👁️ View
                </button>
                <button
                  className="btn btn-sm btn-muted"
                  style={{ width: "auto", padding: "5px 14px", borderRadius: "8px", fontSize: "12px" }}
                >
                  👥 Applicants ({post.jobPostModelsList?.length || 0})
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-4"
            style={{ width: "520px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <h3 className="bold">Post New Job</h3>
              <button className="btn btn-sm btn-muted" style={{ width: "auto", padding: "4px 10px", borderRadius: "8px" }}
                onClick={() => setShowModal(false)}>✕</button>
            </div>

            <hr style={{ marginBottom: "16px", borderColor: "var(--border-color)" }} />

            {message && (
              <div className={msgType === "success" ? "alert-success mb-3" : "alert-danger mb-3"}>
                <p className="fs-p9" style={{ color: msgType === "success" ? "var(--success)" : "var(--danger)", fontWeight: "600" }}>{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="form-group mb-3">
                <label className="form-control-label">Job Title *</label>
                <input className="form-control" name="tiitle" value={form.tiitle} onChange={handleChange} placeholder="e.g. Software Engineer" required />
              </div>

              <div className="row mb-3" style={{ gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-control-label">Required Candidates</label>
                  <input className="form-control" name="requiredCandidate" value={form.requiredCandidate} onChange={handleChange} placeholder="e.g. 10" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-control-label">Eligible Percentage</label>
                  <input className="form-control" name="eligiblePercentage" value={form.eligiblePercentage} onChange={handleChange} placeholder="e.g. 75" />
                </div>
              </div>

              <div className="row mb-3" style={{ gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-control-label">Last Date to Apply</label>
                  <input type="date" className="form-control" name="lastDateToApply" value={form.lastDateToApply} onChange={handleChange} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-control-label">Poster / Role Tag</label>
                  <input className="form-control" name="poster" value={form.poster} onChange={handleChange} placeholder="e.g. Full Time" />
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-control-label">Job Description</label>
                <textarea className="form-control" rows="4" name="description" value={form.description} onChange={handleChange} placeholder="Describe the role, responsibilities..." />
              </div>

              {/* Skill IDs */}
              <div className="form-group mb-3">
                <label className="form-control-label">Skill IDs</label>
                <div className="row" style={{ gap: "8px" }}>
                  <input
                    className="form-control"
                    type="number"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                    placeholder="Enter skill ID and press Add"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-info"
                    style={{ width: "auto", padding: "6px 14px", borderRadius: "8px" }}
                    onClick={handleAddSkill}
                  >
                    + Add
                  </button>
                </div>
                {form.skillIds.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                    {form.skillIds.map(id => (
                      <span key={id} style={{
                        background: "rgba(14,165,233,0.1)", color: "var(--info)",
                        padding: "4px 10px", borderRadius: "20px", fontSize: "12px",
                        fontWeight: "600", display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        🔧 Skill #{id}
                        <span onClick={() => handleRemoveSkill(id)}
                          style={{ cursor: "pointer", fontWeight: "bold", fontSize: "14px", lineHeight: 1 }}>
                          ×
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="row" style={{ gap: "10px" }}>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: "10px", flex: 1 }} disabled={submitting}>
                  {submitting ? "Posting..." : "✔ Post Job"}
                </button>
                <button type="button" className="btn btn-muted" style={{ borderRadius: "10px", flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selected && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div
            className="card p-4"
            style={{ width: "520px", maxWidth: "95%", maxHeight: "85vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <div>
                <p className="bold fs-4" style={{ margin: 0 }}>{selected.tiitle}</p>
                <StatusBadge s={selected.status} />
              </div>
              <button className="btn btn-sm btn-muted" style={{ width: "auto", padding: "4px 10px", borderRadius: "8px" }}
                onClick={() => setShowDetail(false)}>✕</button>
            </div>

            <hr style={{ marginBottom: "12px", borderColor: "var(--border-color)" }} />

            <p className="fs-p8 text-secondary bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Job Details</p>
            <table className="w-100">
              <tbody>
                <Row label="Job Post ID"        value={`JP${String(selected.jobPostId).padStart(3,"0")}`} />
                <Row label="Required Candidates" value={selected.requiredCandidate} />
                <Row label="Eligible %"         value={selected.eligiblePercentage ? `${selected.eligiblePercentage}%` : "—"} />
                <Row label="Posted Date"        value={selected.postedDate} />
                <Row label="Last Date to Apply" value={selected.lastDateToApply} />
                <Row label="Poster / Tag"       value={selected.poster} />
                <Row label="Applicants"         value={selected.jobPostModelsList?.length || 0} />
              </tbody>
            </table>

            {selected.description && (
              <>
                <hr style={{ margin: "12px 0", borderColor: "var(--border-color)" }} />
                <p className="fs-p8 text-secondary bold mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</p>
                <p className="fs-p9">{selected.description}</p>
              </>
            )}

            {selected.companyModel && (
              <>
                <hr style={{ margin: "12px 0", borderColor: "var(--border-color)" }} />
                <p className="fs-p8 text-secondary bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Company</p>
                <table className="w-100">
                  <tbody>
                    <Row label="Company"  value={selected.companyModel.companyName} />
                    <Row label="Industry" value={selected.companyModel.industryType} />
                    <Row label="Location" value={selected.companyModel.location} />
                    <Row label="Email"    value={selected.companyModel.email} />
                    <Row label="Website"  value={selected.companyModel.website} />
                  </tbody>
                </table>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default CompanyJobPosts;