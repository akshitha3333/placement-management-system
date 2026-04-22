import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

const getJsonHeaders = () => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${Cookies.get("token") || ""}`,
  },
});

const emptyForm = {
  tiitle:             "",
  description:        "",
  requiredCandidate:  "",
  postedDate:         "",
  lastDateToApply:    "",
  eligiblePercentage: "",
  skillIds:           [], // array of selected skill IDs
  poster:             null,
};

function CompanyJobPosts() {
  const [posts,          setPosts]          = useState([]);
  const [skills,         setSkills]         = useState([]); // all available skills from /classification/skills
  const [showModal,      setShowModal]      = useState(false);
  const [showDetail,     setShowDetail]     = useState(false);
  const [selected,       setSelected]       = useState(null);
  const [form,           setForm]           = useState(emptyForm);
  const [posterPreview,  setPosterPreview]  = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [message,        setMessage]        = useState("");
  const [msgType,        setMsgType]        = useState("");

  // Fetch job posts (backend now returns only this company's posts for COMPANY role)
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res  = await axios.get(rest.jobPost, getJsonHeaders());
      const list = Array.isArray(res.data?.data) ? res.data.data
                 : Array.isArray(res.data)        ? res.data : [];
      console.log("Job posts fetched:", list.length, list);
      setPosts(list);
    } catch (err) {
      console.error("GET job posts error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all skills for the dropdown
  const fetchSkills = async () => {
    try {
      const res  = await axios.get(rest.skills, getJsonHeaders());
      const list = Array.isArray(res.data?.data) ? res.data.data
                 : Array.isArray(res.data)        ? res.data : [];
      console.log("Skills fetched:", list.length, list);
      setSkills(list);
    } catch (err) {
      console.error("GET skills error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSkills();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, poster: file }));
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  // Toggle a skill in/out of the selected skillIds array
  const toggleSkill = (skillId) => {
    setForm((prev) => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter((id) => id !== skillId)
        : [...prev.skillIds, skillId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.tiitle.trim()) {
      setMessage("Job title is required.");
      setMsgType("error");
      return;
    }
    if (!form.poster) {
      setMessage("Poster image is required.");
      setMsgType("error");
      return;
    }
    if (form.skillIds.length === 0) {
      setMessage("Please select at least one skill.");
      setMsgType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const formData = new FormData();
    formData.append("title",              form.tiitle);
    formData.append("description",        form.description);
    formData.append("requiredCandidate",  form.requiredCandidate);
    formData.append("postedDate",         form.postedDate);
    formData.append("lastDateToApply",    form.lastDateToApply);
    formData.append("eligiblePercentage", form.eligiblePercentage);
    form.skillIds.forEach((id) => formData.append("skillIds", id));
    formData.append("poster", form.poster);

    console.log("Posting job — skillIds:", form.skillIds);

    axios.post(rest.jobPost, formData, getHeaders())
      .then((res) => {
        console.log("Job post response:", res.data);
        setShowModal(false);
        setForm(emptyForm);
        setPosterPreview(null);
        setMessage("Job posted successfully!");
        setMsgType("success");
        fetchPosts(); // refresh list — ensures company filter is applied
        setTimeout(() => setMessage(""), 3000);
      })
      .catch((err) => {
        console.error("POST job error:", err.response?.data || err.message);
        setMessage(err.response?.data?.message || "Failed to post job.");
        setMsgType("error");
      })
      .finally(() => setSubmitting(false));
  };

  const StatusBadge = ({ s }) => {
    const val = (s || "ACTIVE").toUpperCase();
    const map = {
      ACTIVE:   { bg: "rgba(22,163,74,0.1)",  color: "var(--success)", label: "Active"   },
      DEACTIVE: { bg: "rgba(220,38,38,0.1)",  color: "var(--danger)",  label: "Deactive" },
    };
    const c = map[val] || { bg: "rgba(156,163,175,0.15)", color: "var(--gray-500)", label: val };
    return (
      <span style={{
        padding: "4px 12px", borderRadius: "20px", fontWeight: "600",
        fontSize: "0.75rem", background: c.bg, color: c.color,
      }}>
        {c.label}
      </span>
    );
  };

  const Row = ({ label, value }) => (
    <tr>
      <td className="text-secondary fs-p9" style={{ width: "165px", verticalAlign: "top", paddingRight: "8px", paddingBottom: "6px" }}>{label}</td>
      <td className="fs-p9" style={{ paddingBottom: "6px" }}>{value || "—"}</td>
    </tr>
  );

  const getSkillName = (id) => {
    const s = skills.find((sk) => sk.skillId === id);
    return s ? (s.skill || s.skillName || s.name || `Skill #${id}`) : `Skill #${id}`;
  };

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold">Job Posts</h2>
          <p className="fs-p9 text-secondary">Post and manage your job requirements</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "auto", padding: "8px 18px", borderRadius: "10px" }}
          onClick={() => {
            setShowModal(true);
            setMessage("");
            setForm(emptyForm);
            setPosterPreview(null);
          }}
        >
          + Post New Job
        </button>
      </div>

      {/* Global message (outside modal) */}
      {message && !showModal && (
        <div className={msgType === "success" ? "alert-success mb-3" : "alert-danger mb-3"}>
          <p className="fs-p9" style={{
            color: msgType === "success" ? "var(--success)" : "var(--danger)",
            fontWeight: "600",
          }}>
            {message}
          </p>
        </div>
      )}

      {/* Posts Grid */}
      {loading ? (
        <p className="text-center p-4 text-secondary">Loading...</p>
      ) : posts.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No job posts yet</p>
          <p className="text-secondary fs-p9">Click "Post New Job" to get started</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {posts.map((post) => (
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

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "8px 0" }}>
                {post.requiredCandidate && (
                  <span className="fs-p8" style={{
                    background: "rgba(14,165,233,0.1)", color: "var(--info)",
                    padding: "3px 10px", borderRadius: "12px",
                  }}>
                    {post.requiredCandidate} openings
                  </span>
                )}
                {post.eligiblePercentage && (
                  <span className="fs-p8" style={{
                    background: "rgba(245,158,11,0.1)", color: "var(--warning)",
                    padding: "3px 10px", borderRadius: "12px",
                  }}>
                    {post.eligiblePercentage}% eligible
                  </span>
                )}
              </div>

              <p className="fs-p8 text-secondary">
                Posted: {post.postedDate || "—"} | Deadline: {post.lastDateToApply || "—"}
              </p>

              {post.description && (
                <p className="fs-p8 text-secondary mt-1" style={{
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
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
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Post Job Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="card p-4"
            style={{ width: "560px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <h3 className="bold">Post New Job</h3>
              <button
                className="btn btn-sm btn-muted"
                style={{ width: "auto", padding: "4px 10px", borderRadius: "8px" }}
                onClick={() => setShowModal(false)}
              >x</button>
            </div>

            <hr style={{ marginBottom: "16px", borderColor: "var(--border-color)" }} />

            {/* Modal message */}
            {message && (
              <div className={msgType === "success" ? "alert-success mb-3" : "alert-danger mb-3"}>
                <p className="fs-p9" style={{
                  color: msgType === "success" ? "var(--success)" : "var(--danger)",
                  fontWeight: "600",
                }}>
                  {message}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Job Title */}
              <div className="form-group mb-3">
                <label className="form-control-label">Job Title *</label>
                <input
                  className="form-control"
                  name="tiitle"
                  value={form.tiitle}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>

              {/* Required Candidates + Eligible % */}
              <div className="row mb-3" style={{ gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-control-label">Required Candidates *</label>
                  <input
                    className="form-control"
                    name="requiredCandidate"
                    value={form.requiredCandidate}
                    onChange={handleChange}
                    placeholder="e.g. 10"
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-control-label">Eligible Percentage *</label>
                  <input
                    className="form-control"
                    name="eligiblePercentage"
                    value={form.eligiblePercentage}
                    onChange={handleChange}
                    placeholder="e.g. 75"
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="row mb-3" style={{ gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-control-label">Posted Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    name="postedDate"
                    value={form.postedDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-control-label">Last Date to Apply *</label>
                  <input
                    type="date"
                    className="form-control"
                    name="lastDateToApply"
                    value={form.lastDateToApply}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group mb-3">
                <label className="form-control-label">Job Description *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the role and responsibilities..."
                  required
                />
              </div>

              {/* ── Skills — dropdown, multi-select ── */}
              <div className="form-group mb-3">
                <label className="form-control-label">
                  Required Skills *
                  {form.skillIds.length > 0 && (
                    <span style={{
                      marginLeft: 8, fontSize: "0.72rem", fontWeight: 600,
                      padding: "2px 8px", borderRadius: 10,
                      background: "rgba(14,165,233,0.12)", color: "var(--info)",
                    }}>
                      {form.skillIds.length} selected
                    </span>
                  )}
                </label>

                {skills.length === 0 ? (
                  <div className="alert-info">
                    <p className="fs-p9" style={{ color: "var(--info)" }}>
                      No skills found. Please add skills in the Skills Required page first.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Dropdown — picking one adds it to the list */}
                    <select
                      className="form-control"
                      value=""
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        if (!id) return;
                        if (!form.skillIds.includes(id)) {
                          setForm((prev) => ({ ...prev, skillIds: [...prev.skillIds, id] }));
                        }
                        e.target.value = ""; // reset dropdown after selection
                      }}
                    >
                      <option value="">-- Select a skill to add --</option>
                      {skills
                        .filter((sk) => !form.skillIds.includes(sk.skillId)) // hide already selected
                        .map((sk) => (
                          <option key={sk.skillId} value={sk.skillId}>
                            {sk.skill || sk.skillName || sk.name}
                          </option>
                        ))}
                    </select>

                    {/* Selected skill chips — name only, no ID */}
                    {form.skillIds.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {form.skillIds.map((id) => (
                          <span key={id} style={{
                            background: "rgba(14,165,233,0.1)", color: "var(--info)",
                            padding: "4px 10px 4px 12px", borderRadius: 20,
                            fontSize: "0.78rem", fontWeight: 600,
                            display: "inline-flex", alignItems: "center", gap: 6,
                          }}>
                            {getSkillName(id)}
                            <span
                              onClick={() => toggleSkill(id)}
                              style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1 }}
                            >×</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Poster upload */}
              <div className="form-group mb-4">
                <label className="form-control-label">Poster Image *</label>
                <div
                  style={{
                    border: "2px dashed var(--border-color)", borderRadius: "12px",
                    padding: "20px", textAlign: "center", cursor: "pointer",
                    background: posterPreview ? "transparent" : "rgba(14,165,233,0.03)",
                  }}
                  onClick={() => document.getElementById("posterInput").click()}
                >
                  {posterPreview ? (
                    <>
                      <img src={posterPreview} alt="Preview"
                        style={{ maxHeight: "140px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }} />
                      <p className="fs-p8 text-secondary mt-2">{form.poster?.name}</p>
                      <p className="fs-p8" style={{ color: "var(--info)" }}>Click to change</p>
                    </>
                  ) : (
                    <>
                      <p className="fs-p9 bold">Click to upload poster</p>
                      <p className="fs-p8 text-secondary">PNG, JPG, JPEG supported</p>
                    </>
                  )}
                  <input
                    id="posterInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="row" style={{ gap: "10px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: "10px", flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? "Posting..." : "Post Job"}
                </button>
                <button
                  type="button"
                  className="btn btn-muted"
                  style={{ borderRadius: "10px", flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {showDetail && selected && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div
            className="card p-4"
            style={{ width: "520px", maxWidth: "95%", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row space-between items-center mb-3">
              <div>
                <p className="bold fs-4" style={{ margin: 0 }}>{selected.tiitle}</p>
                <StatusBadge s={selected.status} />
              </div>
              <button
                className="btn btn-sm btn-muted"
                style={{ width: "auto", padding: "4px 10px", borderRadius: "8px" }}
                onClick={() => setShowDetail(false)}
              >x</button>
            </div>

            <hr style={{ marginBottom: "12px", borderColor: "var(--border-color)" }} />

            <p className="fs-p8 text-secondary bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Job Details
            </p>
            <table className="w-100">
              <tbody>
                <Row label="Job Post ID"          value={`JP${String(selected.jobPostId).padStart(3, "0")}`} />
                <Row label="Required Candidates"  value={selected.requiredCandidate} />
                <Row label="Eligible %"           value={selected.eligiblePercentage ? `${selected.eligiblePercentage}%` : "—"} />
                <Row label="Posted Date"          value={selected.postedDate} />
                <Row label="Last Date to Apply"   value={selected.lastDateToApply} />
              </tbody>
            </table>

            {selected.description && (
              <>
                <hr style={{ margin: "12px 0", borderColor: "var(--border-color)" }} />
                <p className="fs-p8 text-secondary bold mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Description
                </p>
                <p className="fs-p9">{selected.description}</p>
              </>
            )}

            {selected.companyModel && (
              <>
                <hr style={{ margin: "12px 0", borderColor: "var(--border-color)" }} />
                <p className="fs-p8 text-secondary bold mb-2" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Company
                </p>
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