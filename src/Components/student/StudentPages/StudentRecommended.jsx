import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function StudentRecommendations() {

  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────
  const [suggestions,    setSuggestions]    = useState([]);
  const [myProfile,      setMyProfile]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [applied,        setApplied]        = useState({});
  const [applying,       setApplying]       = useState(null);
  const [showModal,      setShowModal]      = useState(null);
  const [resumes,        setResumes]        = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);

  // ── Auth header ────────────────────────────────────────────
  const authHeader = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token")}`,
    },
  });

  // ── Fetch: job suggestions ─────────────────────────────────
 const fetchSuggestions = async () => {
  try {
    const res  = await axios.get(rest.jobSuggestions, authHeader());
    const list = res.data?.data || res.data || [];
    const arr  = Array.isArray(list) ? list : [];
    setSuggestions(arr);

    // 🔥 Load from localStorage FIRST
    const storedApplied = JSON.parse(localStorage.getItem("appliedJobs") || "{}");

    const alreadyApplied = { ...storedApplied };

    arr.forEach((s) => {
      if (s.applied || s.jobApplications?.length > 0) {
        alreadyApplied[s.jobSuggestionId] = true;
      }
    });

    // 🔥 Save again (important)
    localStorage.setItem("appliedJobs", JSON.stringify(alreadyApplied));

    setApplied(alreadyApplied);

  } catch (err) {
    console.error("fetchSuggestions error:", err);
    setError("Failed to load recommendations.");
  }
};

  // ── Fetch: own student profile ─────────────────────────────
  const fetchProfile = async () => {
    try {
      const res     = await axios.get(rest.students, authHeader());
      const stuList = res.data?.data || res.data || [];
      const me      = Array.isArray(stuList) ? stuList[0] : stuList;
      setMyProfile(me);
    } catch (err) {
      console.error("fetchProfile error:", err);
    }
  };

  // ── Fetch: resumes list ────────────────────────────────────
  const fetchResumes = async () => {
    try {
      const res  = await axios.get(rest.studentResume, authHeader());
      const data = res.data?.data || res.data || [];
      setResumes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchResumes error:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSuggestions(), fetchProfile(), fetchResumes()]);
      setLoading(false);
    };
    init();
  }, []);

  // ── Apply: POST JSON { resumeId } ─────────────────────────
  const applyToJob = async () => {
    if (!showModal) return;

    const { jobSuggestionId } = showModal;

    if (!selectedResume) {
      alert("⚠️ Please select a resume before submitting.");
      return;
    }

    setApplying(jobSuggestionId);

    try {
      const payload = {
        resumeId: selectedResume.resumeId,
      };

     console.log("🚀 Applying to:", jobSuggestionId);

const response = await axios.post(
  `${rest.jobSuggestions}/${jobSuggestionId}/job-applications`,
  payload,
  authHeader()
);

console.log("📥 Apply response:", response);

      setApplied((prev) => {
        const updated = { ...prev, [jobSuggestionId]: true };
      
        // persist
        localStorage.setItem("appliedJobs", JSON.stringify(updated));
      
        return updated;
      });      setShowModal(null);
      setSelectedResume(null);
      alert("✅ Application submitted successfully!");

    } catch (err) {
      console.error("applyToJob error:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error;
      alert(serverMsg ? `Failed: ${serverMsg}` : "Failed to submit application. Please try again.");
    } finally {
      setApplying(null);
    }
  };

  // ── Filter ─────────────────────────────────────────────────
  const filteredSuggestions = suggestions.filter((sug) => {
    const company = sug.jobPostModel?.companyModel?.companyName || "";
    const title   = sug.jobPostModel?.title || sug.jobPostModel?.tiitle || "";
    const term    = search.toLowerCase();
    return company.toLowerCase().includes(term) || title.toLowerCase().includes(term);
  });

  // ── Stats ──────────────────────────────────────────────────
  const totalSuggested = suggestions.length;
  const totalApplied   = Object.keys(applied).length;
  const totalPending   = totalSuggested - totalApplied;

  // ── Helpers ────────────────────────────────────────────────
  const matchColor = (m) =>
    m >= 80 ? "var(--success)" : m >= 60 ? "var(--warning)" : "var(--danger)";

  const getTutorName = (sug) =>
    sug?.tutorModel?.tutorName ||
    sug?.tutorModel?.name      ||
    sug?.tutorName             ||
    sug?.recommendedBy         ||
    "Your Tutor";

  const jobTitle = (job) => job?.title || job?.tiitle || "—";

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Page Title */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">🎯 Tutor Recommendations</h2>
          <p className="fs-p9 text-secondary">
            Jobs your tutor handpicked for you — review and apply directly
          </p>
        </div>
        <button
          className="btn btn-muted"
          style={{ padding: "8px 16px", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => navigate("student-page/applications")}
        >
          📋 View My Applications
        </button>
      </div>

      {error && <div className="alert-danger mb-4">⚠️ {error}</div>}

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        {[
          { label: "Recommended", value: totalSuggested, icon: "🎯", color: "var(--primary)" },
          { label: "Applied",     value: totalApplied,   icon: "✅", color: "var(--success)" },
          { label: "Pending",     value: totalPending,   icon: "⏳", color: "var(--warning)" },
        ].map((stat, i) => (
          <div className="col-4 p-2" key={i}>
            <div className="card p-3 stat-card row items-center g-3">
              <div className="fs-4">{stat.icon}</div>
              <div>
                <p className="fs-p8 text-secondary">{stat.label}</p>
                <h3 className="bold" style={{ color: stat.color }}>{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="w-40 mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search by company or job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Suggestion List */}
      {loading ? (
        <p className="text-secondary p-4">Loading recommendations...</p>
      ) : filteredSuggestions.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="fs-4">📭</p>
          <p className="bold mt-2">No recommendations yet</p>
          <p className="fs-p9 text-secondary">Your tutor hasn't suggested any jobs yet. Check back soon!</p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>

          {/* Table Header */}
          <div className="row items-center"
            style={{
              background: "var(--gray-100)", padding: "10px 16px",
              borderBottom: "1px solid var(--border-color)",
              fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)"
            }}>
            <div className="col-3">Job Title</div>
            <div className="col-2">Company</div>
            <div className="col-2">Location</div>
            <div className="col-1 text-center">Openings</div>
            <div className="col-1 text-center">Eligibility</div>
            <div className="col-1 text-center">Status</div>
            <div className="col-2 text-center">Last Date / Action</div>
          </div>

          {/* Suggestion Rows */}
          {filteredSuggestions.map((sug) => {
            const job       = sug.jobPostModel || {};
            const isOpen    = expandedId === sug.jobSuggestionId;
            const isApplied = !!applied[sug.jobSuggestionId];

            return (
              <div key={sug.jobSuggestionId}>

                {/* Collapsed Row */}
                <div className="row items-center"
                  style={{
                    padding: "12px 16px",
                    borderBottom: isOpen ? "none" : "1px solid var(--border-color)",
                    background: isOpen ? "rgba(50,85,99,0.03)" : "#fff"
                  }}>
                  <div className="col-3 bold fs-p9">{jobTitle(job)}</div>
                  <div className="col-2 fs-p9 text-secondary">{job.companyModel?.companyName || "—"}</div>
                  <div className="col-2 fs-p9 text-secondary">📍 {job.companyModel?.location || "—"}</div>
                  <div className="col-1 text-center fs-p9">👥 {job.requiredCandidate || "—"}</div>
                  <div className="col-1 text-center fs-p9">
                    {job.eligiblePercentage ? `${job.eligiblePercentage}%` : "—"}
                  </div>
                  <div className="col-1 text-center">
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 12,
                      background: isApplied ? "rgba(22,163,74,0.12)" : "rgba(50,85,99,0.1)",
                      color:      isApplied ? "var(--success)"        : "var(--primary)",
                      border:     `1px solid ${isApplied ? "rgba(22,163,74,0.3)" : "rgba(50,85,99,0.3)"}`,
                    }}>
                      {isApplied ? "Applied" : "Pending"}
                    </span>
                  </div>
                  <div className="col-2 row items-center justify-center g-2">
                    <span className="fs-p8 text-secondary">{job.lastDateToApply || "—"}</span>
                    {!isApplied && (
                      <button
                        className={`btn w-auto ${isOpen ? "btn-muted" : "btn-primary"}`}
                        style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                        onClick={() => setExpandedId(isOpen ? null : sug.jobSuggestionId)}
                      >
                        {isOpen ? "✕ Close" : "👁 View"}
                      </button>
                    )}
                    {isApplied && (
                      <button
                        className="btn w-auto"
                        style={{ padding: "5px 12px", fontSize: "0.78rem", background: "var(--success)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}
                        onClick={() => navigate("/student-page/applications")}
                      >
                        📋 My Application
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Panel */}
                {isOpen && (
                  <div style={{
                    background: "rgba(50,85,99,0.02)",
                    borderTop: "1px dashed var(--border-color)",
                    borderBottom: "1px solid var(--border-color)",
                    padding: "20px"
                  }}>
                    <div className="row g-5">

                      {/* LEFT — Job Details */}
                      <div className="col-6">
                        <h4 className="bold mb-1">{jobTitle(job)}</h4>
                        <p className="fs-p9 text-secondary mb-3">
                          🏢 {job.companyModel?.companyName} &nbsp;|&nbsp; 📍 {job.companyModel?.location}
                        </p>

                        {job.description && (
                          <div className="card p-3 mb-3" style={{ background: "var(--gray-100)" }}>
                            <p className="fs-p8 bold mb-1">📄 Job Description</p>
                            <p className="fs-p9" style={{ lineHeight: 1.7 }}>{job.description}</p>
                          </div>
                        )}

                        <div className="row g-2 flex-wrap">
                          {[
                            { icon: "👥", label: "Openings",    value: job.requiredCandidate },
                            { icon: "📊", label: "Eligibility", value: job.eligiblePercentage ? `${job.eligiblePercentage}%` : null },
                            { icon: "📅", label: "Posted",      value: job.postedDate },
                            { icon: "⏰", label: "Last Date",   value: job.lastDateToApply },
                          ].filter((m) => m.value).map((m) => (
                            <div key={m.label} className="card p-2" style={{ minWidth: 110, flex: 1 }}>
                              <p className="fs-p8 text-secondary">{m.icon} {m.label}</p>
                              <p className="bold fs-p8 mt-1">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ width: 1, background: "var(--border-color)" }} />

                      {/* RIGHT — Recommendation + Apply */}
                      <div className="col-6">
                        <div className="row space-between items-center mb-3">
                          <h5 className="bold">📋 Recommendation Details</h5>
                          <div className="row items-center g-2"
                            style={{ background: "rgba(50,85,99,0.08)", borderRadius: 8, padding: "6px 12px" }}>
                            <div className="bg-primary text-white br-circle bold"
                              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>
                              {getTutorName(sug).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="fs-p8 text-secondary" style={{ lineHeight: 1 }}>Recommended by</p>
                              <p className="bold fs-p9" style={{ color: "var(--primary)" }}>{getTutorName(sug)}</p>
                            </div>
                          </div>
                        </div>

                        {sug.note && (
                          <div className="alert-info mb-3">
                            <p className="fs-p8 bold mb-1">💬 Tutor's Note</p>
                            <p className="fs-p9">{sug.note}</p>
                          </div>
                        )}

                        {sug.matchScore != null && (
                          <div className="card p-3 mb-3">
                            <div className="row space-between items-center mb-2">
                              <p className="fs-p9 bold">🤖 Match Score</p>
                              <p className="bold fs-3" style={{ color: matchColor(sug.matchScore) }}>
                                {sug.matchScore}%
                              </p>
                            </div>
                            <div style={{ height: 6, background: "var(--gray-200)", borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ width: `${sug.matchScore}%`, height: "100%", background: matchColor(sug.matchScore), borderRadius: 999 }} />
                            </div>
                            <p className="fs-p8 text-secondary mt-2">
                              Based on your CGPA (70%) + skill keyword overlap (30%)
                            </p>
                          </div>
                        )}

                        {myProfile?.skills && (
                          <div className="card p-3 mb-3">
                            <p className="fs-p8 bold mb-2">🛠️ Your Skills</p>
                            <div className="row g-1" style={{ flexWrap: "wrap" }}>
                              {myProfile.skills.split(",").slice(0, 4).map((sk) => (
                                <span key={sk} className="fs-p7 br-md"
                                  style={{ background: "var(--gray-200)", padding: "2px 10px", color: "var(--gray-700)" }}>
                                  {sk.trim()}
                                </span>
                              ))}
                              {myProfile.skills.split(",").length > 4 && (
                                <span className="fs-p7 text-secondary">
                                  +{myProfile.skills.split(",").length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {isApplied ? (
                          <div>
                            <div className="alert-success mb-2">
                              <p className="fs-p9 bold" style={{ color: "var(--success)" }}>
                                ✅ You have already applied to this job.
                              </p>
                            </div>
                            <button
                              className="btn"
                              style={{ padding: "8px 16px", fontSize: "0.82rem", background: "var(--success)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                              onClick={() => navigate("/student-page/applications")}
                            >
                              📋 View My Application
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ marginTop: 8 }}
                            onClick={() => {
                              setShowModal(sug);
                              setSelectedResume(null);
                            }}
                          >
                            🚀 Apply Now
                          </button>
                        )}

                        <div className="alert-info mt-3">
                          <p className="fs-p8 text-info">
                            🎯 <strong>Recommended by {getTutorName(sug)}.</strong> Apply before the deadline to maximise your chances.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Apply Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div
            className="card p-5"
            style={{ width: 500, maxWidth: "95%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="row space-between items-center mb-1">
              <h4 className="bold">🚀 Apply for Job</h4>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowModal(null)}>✕</span>
            </div>

            <p className="bold fs-p9 mb-1">{jobTitle(showModal.jobPostModel)}</p>
            <p className="fs-p8 text-secondary mb-3">
              🏢 {showModal.jobPostModel?.companyModel?.companyName}
            </p>

            <div className="row items-center g-2 mb-4"
              style={{ background: "rgba(50,85,99,0.06)", borderRadius: 8, padding: "8px 12px", display: "inline-flex" }}>
              <span className="fs-p8">👨‍🏫 Recommended by</span>
              <span className="bold fs-p8" style={{ color: "var(--primary)" }}>{getTutorName(showModal)}</span>
            </div>

            {/* ── Select Resume ── */}
            <div className="form-group mb-4">
              <label className="form-control-label mb-2">
                📄 Select Resume <span style={{ color: "var(--danger)" }}>*</span>
              </label>

              {resumes.length === 0 ? (
                <p className="fs-p9 text-secondary">
                  No resumes found. Please upload a resume in your Profile first.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {resumes.map((res) => {
                    const isSelected = selectedResume?.resumeId === res.resumeId;
                    return (
                      <div
                        key={res.resumeId}
                        onClick={() => setSelectedResume(res)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "8px",
                          border: isSelected
                            ? "2px solid var(--primary)"
                            : "1px solid var(--border-color)",
                          cursor: "pointer",
                          background: isSelected ? "rgba(50,85,99,0.06)" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div>
                          <p className="bold fs-p9">{res.resumeTitle || "Untitled Resume"}</p>
                          <p className="fs-p8 text-secondary">
                            {res.date || "Uploaded"} &nbsp;·&nbsp;
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                              ID: {res.resumeId}
                            </span>
                          </p>
                        </div>
                        {isSelected && (
                          <span style={{
                            background: "var(--primary)", color: "#fff",
                            borderRadius: "50%", width: 22, height: 22,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.7rem", fontWeight: 700, flexShrink: 0
                          }}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedResume && (
                <div className="mt-2" style={{
                  background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.3)",
                  borderRadius: 6, padding: "6px 12px"
                }}>
                  <p className="fs-p8" style={{ color: "var(--success)" }}>
                    ✅ Selected: <strong>{selectedResume.resumeTitle}</strong> — resumeId: <strong>{selectedResume.resumeId}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="row g-2">
              <button
                className="btn btn-primary"
                onClick={applyToJob}
                disabled={applying === showModal.jobSuggestionId || !selectedResume}
                style={{ opacity: !selectedResume ? 0.6 : 1 }}
              >
                {applying === showModal.jobSuggestionId ? "Submitting..." : "✅ Submit Application"}
              </button>
              <button className="btn btn-muted" onClick={() => setShowModal(null)}>
                Cancel
              </button>
            </div>

            {!selectedResume && (
              <p className="fs-p8 mt-2" style={{ color: "var(--danger)" }}>
                ⚠️ Please select a resume to submit the application.
              </p>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default StudentRecommendations;