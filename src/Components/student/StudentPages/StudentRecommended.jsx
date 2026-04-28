import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

function StudentRecommendations() {
  const navigate = useNavigate();

  const [suggestions,    setSuggestions]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null); // which row is open
  const [applied,        setApplied]        = useState({});   // { [jobSuggestionId]: true }
  const [applying,       setApplying]       = useState(null);
  const [showModal,      setShowModal]      = useState(null); // suggestion object
  const [resumes,        setResumes]        = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);

  const getHeaders = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || ""}`,
    },
  });

  // ── Fetch suggestions — derive applied state from backend only ────────────
  const fetchSuggestions = async () => {
    try {
      const res  = await axios.get(rest.jobSuggestions, getHeaders());
      const list = res.data?.data || res.data || [];
      const arr  = Array.isArray(list) ? list : [];
      console.log("Suggestions raw:", arr);
      setSuggestions(arr);

      // Build applied map ONLY from backend data — never from localStorage
      const appliedMap = {};
      arr.forEach((s) => {
        // backend marks applied via jobApplications array or an applied flag
        if (s.applied === true || (Array.isArray(s.jobApplications) && s.jobApplications.length > 0)) {
          appliedMap[s.jobSuggestionId] = true;
        }
      });
      console.log("Applied map from backend:", appliedMap);
      setApplied(appliedMap);
    } catch (err) {
      console.error("fetchSuggestions error:", err.response?.data || err.message);
      setError("Failed to load recommendations.");
    }
  };

  // ── Fetch resumes for apply modal ─────────────────────────────────────────
  const fetchResumes = async () => {
    try {
      const res  = await axios.get(rest.studentResume, getHeaders());
      const data = res.data?.data || res.data || [];
      const list = Array.isArray(data) ? data : [];
      console.log("Resumes:", list);
      setResumes(list);
    } catch (err) {
      console.error("fetchResumes error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSuggestions(), fetchResumes()]);
      setLoading(false);
    };
    init();
  }, []);

  // ── Submit application ────────────────────────────────────────────────────
  const applyToJob = async () => {
    if (!showModal || !selectedResume) return;
    const { jobSuggestionId } = showModal;

    setApplying(jobSuggestionId);
    try {
      const payload = { resumeId: selectedResume.resumeId };
      console.log("Applying — suggestionId:", jobSuggestionId, "payload:", payload);

      const res = await axios.post(
        `${rest.jobSuggestions}/${jobSuggestionId}/job-applications`,
        payload,
        getHeaders()
      );
      console.log("Apply response:", res.data);

      // Mark as applied in state (no localStorage)
      setApplied((prev) => ({ ...prev, [jobSuggestionId]: true }));
      setShowModal(null);
      setSelectedResume(null);
      setExpandedId(null);
      alert("Application submitted successfully!");
    } catch (err) {
      console.error("applyToJob error:", err.response?.data || err.message);
      const msg = err?.response?.data?.message || err?.response?.data?.error;
      alert(msg ? `Failed: ${msg}` : "Failed to submit application. Please try again.");
    } finally {
      setApplying(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const jobTitle   = (job) => job?.tiitle || job?.title || "—";
  const getTutorName = (sug) =>
    sug?.tutorModel?.tutorName || sug?.tutorModel?.name || "Your Tutor";

  const filtered = suggestions.filter((sug) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const company = (sug.jobPostModel?.companyModel?.companyName || "").toLowerCase();
    const title   = jobTitle(sug.jobPostModel).toLowerCase();
    return company.includes(q) || title.includes(q);
  });

  const totalApplied = Object.keys(applied).length;
  const totalPending = suggestions.length - totalApplied;

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">Tutor Recommendations</h2>
          <p className="fs-p9 text-secondary">
            Jobs your tutor handpicked — click View to read details, then Apply
          </p>
        </div>
        <button
          className="btn btn-muted w-auto"
          style={{ padding: "8px 16px", fontSize: "0.82rem" }}
          onClick={() => navigate("/student-page/applications")}
        >
          My Applications
        </button>
      </div>

      {error && (
        <div className="alert-danger mb-4">
          <p className="text-danger fs-p9">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="row mb-4" style={{ gap: 10 }}>
        {[
          { label: "Recommended", value: suggestions.length, color: "var(--primary)" },
          { label: "Applied",     value: totalApplied,       color: "var(--success)" },
          { label: "Pending",     value: totalPending,       color: "var(--warning)" },
        ].map((s, i) => (
          <div key={i} style={{ flex: "0 0 140px" }}>
            <div className="card p-3 text-center stat-card">
              <h2 className="bold" style={{ color: s.color }}>{s.value}</h2>
              <p className="fs-p9 text-secondary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ maxWidth: 340, marginBottom: 16 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by company or job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <p className="text-secondary p-4">Loading recommendations...</p>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="bold mt-2">No recommendations yet</p>
          <p className="fs-p9 text-secondary mt-1">
            Your tutor hasn't suggested any jobs yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>

          {/* Table header */}
          <div className="row items-center" style={{
            background: "var(--gray-100)", padding: "10px 16px",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
          }}>
            <div style={{ width: 36 }}>#</div>
            <div style={{ flex: 3 }}>Job Title</div>
            <div style={{ flex: 2 }}>Company</div>
            <div style={{ flex: 2 }}>Location</div>
            <div style={{ flex: 1, textAlign: "center" }}>Seats</div>
            <div style={{ flex: 1, textAlign: "center" }}>Min %</div>
            <div style={{ flex: 1, textAlign: "center" }}>Status</div>
            <div style={{ flex: 2, textAlign: "center" }}>Actions</div>
          </div>

          {filtered.map((sug, idx) => {
            const job       = sug.jobPostModel || {};
            const company   = job.companyModel  || {};
            const isOpen    = expandedId === sug.jobSuggestionId;
            const isApplied = !!applied[sug.jobSuggestionId];

            return (
              <div key={sug.jobSuggestionId}>

                {/* Collapsed row */}
                <div
                  className="row items-center"
                  style={{
                    padding: "12px 16px",
                    borderBottom: isOpen ? "none" : "1px solid var(--border-color)",
                    background: isOpen ? "rgba(50,85,99,0.03)" : "#fff",
                    borderLeft: isApplied ? "4px solid var(--success)" : "4px solid transparent",
                  }}
                >
                  <div style={{ width: 36 }} className="fs-p9 text-secondary">{idx + 1}</div>
                  <div style={{ flex: 3 }}>
                    <p className="bold fs-p9">{jobTitle(job)}</p>
                    <p className="fs-p8 text-secondary">By: {getTutorName(sug)}</p>
                  </div>
                  <div style={{ flex: 2 }} className="fs-p9 text-secondary">{company.companyName || "—"}</div>
                  <div style={{ flex: 2 }} className="fs-p9 text-secondary">{company.location || "—"}</div>
                  <div style={{ flex: 1, textAlign: "center" }} className="fs-p9">{job.requiredCandidate || "—"}</div>
                  <div style={{ flex: 1, textAlign: "center" }} className="fs-p9">
                    {job.eligiblePercentage ? `${job.eligiblePercentage}%` : "—"}
                  </div>

                  {/* Status badge */}
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 12,
                      background: isApplied ? "rgba(22,163,74,0.12)" : "rgba(50,85,99,0.1)",
                      color:      isApplied ? "var(--success)"        : "var(--primary)",
                    }}>
                      {isApplied ? "Applied" : "Pending"}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ flex: 2, textAlign: "center", display: "flex", gap: 6, justifyContent: "center" }}>
                    {/* VIEW button — always shown, toggles the expanded panel */}
                    <button
                      className="btn btn-muted w-auto"
                      style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                      onClick={() => setExpandedId(isOpen ? null : sug.jobSuggestionId)}
                    >
                      {isOpen ? "Close" : "View"}
                    </button>

                    {/* APPLY button — only shown if NOT yet applied */}
                    {!isApplied && (
                      <button
                        className="btn btn-primary w-auto"
                        style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                        onClick={() => {
                          setShowModal(sug);
                          setSelectedResume(null);
                        }}
                      >
                        Apply
                      </button>
                    )}

                    {/* Already applied — link to applications */}
                    {isApplied && (
                      <button
                        className="btn w-auto"
                        style={{
                          padding: "5px 12px", fontSize: "0.78rem",
                          background: "var(--success)", color: "#fff",
                          border: "none", borderRadius: 6, cursor: "pointer",
                        }}
                        onClick={() => navigate("/student-page/applications")}
                      >
                        View Application
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--border-color)",
                    background: "rgba(50,85,99,0.02)",
                    borderTop: "1px dashed var(--border-color)",
                  }}>
                    <div className="row" style={{ gap: 24 }}>

                      {/* LEFT — job details */}
                      <div style={{ flex: 1 }}>
                        <h4 className="bold mb-2">{jobTitle(job)}</h4>
                        <p className="fs-p9 text-secondary mb-3">
                          {company.companyName} · {company.location}
                        </p>

                        {job.description && (
                          <div style={{
                            background: "var(--gray-100)", borderRadius: 8,
                            padding: "12px 14px", marginBottom: 14,
                          }}>
                            <p className="fs-p8 bold mb-1">Description</p>
                            <p className="fs-p9" style={{ lineHeight: 1.7 }}>{job.description}</p>
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {[
                            { label: "Openings",    value: job.requiredCandidate },
                            { label: "Min %",       value: job.eligiblePercentage ? `${job.eligiblePercentage}%` : null },
                            { label: "Posted",      value: job.postedDate },
                            { label: "Last Date",   value: job.lastDateToApply },
                          ].filter((f) => f.value).map((f) => (
                            <div key={f.label} style={{
                              background: "#fff", border: "1px solid var(--border-color)",
                              borderRadius: 8, padding: "8px 12px",
                            }}>
                              <p className="fs-p8 text-secondary">{f.label}</p>
                              <p className="bold fs-p9">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* RIGHT — tutor note + apply button */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          background: "rgba(50,85,99,0.06)", borderRadius: 8,
                          padding: "12px 14px", marginBottom: 14,
                          display: "flex", alignItems: "center", gap: 12,
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                            background: "var(--primary)", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700,
                          }}>
                            {getTutorName(sug).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="fs-p8 text-secondary">Recommended by</p>
                            <p className="bold fs-p9" style={{ color: "var(--primary)" }}>
                              {getTutorName(sug)}
                            </p>
                          </div>
                        </div>

                        {sug.note && (
                          <div style={{
                            background: "rgba(14,165,233,0.07)",
                            border: "1px solid rgba(14,165,233,0.2)",
                            borderRadius: 8, padding: "10px 14px", marginBottom: 14,
                          }}>
                            <p className="fs-p8 bold mb-1">Tutor's Note</p>
                            <p className="fs-p9">{sug.note}</p>
                          </div>
                        )}

                        {/* Apply / already applied */}
                        {isApplied ? (
                          <div>
                            <div className="alert-success mb-3">
                              <p className="fs-p9 bold text-success">
                                You have already applied to this job.
                              </p>
                            </div>
                            <button
                              className="btn w-auto"
                              style={{
                                padding: "9px 20px", background: "var(--success)",
                                color: "#fff", border: "none", borderRadius: 8,
                                cursor: "pointer", fontWeight: 600,
                              }}
                              onClick={() => navigate("/student-page/applications")}
                            >
                              View My Application
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "10px 24px", fontSize: "0.9rem" }}
                            onClick={() => {
                              setShowModal(sug);
                              setSelectedResume(null);
                            }}
                          >
                            Apply Now
                          </button>
                        )}

                        <div style={{
                          marginTop: 14, background: "rgba(245,158,11,0.07)",
                          border: "1px solid rgba(245,158,11,0.2)",
                          borderRadius: 8, padding: "10px 14px",
                        }}>
                          <p className="fs-p8 text-secondary">
                            Apply before <strong>{job.lastDateToApply || "the deadline"}</strong> to maximise your chances.
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
            <div className="row space-between items-center mb-3">
              <h4 className="bold">Apply for Job</h4>
              <span className="cursor-pointer fs-4 text-secondary" onClick={() => setShowModal(null)}>x</span>
            </div>

            <p className="bold fs-p9 mb-1">{jobTitle(showModal.jobPostModel)}</p>
            <p className="fs-p8 text-secondary mb-1">
              {showModal.jobPostModel?.companyModel?.companyName}
            </p>
            <p className="fs-p8 text-secondary mb-4">
              Recommended by: {getTutorName(showModal)}
            </p>

            {/* Resume picker */}
            <div className="form-group mb-4">
              <label className="form-control-label mb-2">
                Select Resume <span style={{ color: "var(--danger)" }}>*</span>
              </label>

              {resumes.length === 0 ? (
                <div className="alert-info">
                  <p className="fs-p9" style={{ color: "var(--info)" }}>
                    No resumes found. Please upload a resume in your Profile first.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {resumes.map((r) => {
                    const isSel = selectedResume?.resumeId === r.resumeId;
                    return (
                      <div
                        key={r.resumeId}
                        onClick={() => setSelectedResume(r)}
                        style={{
                          padding: "12px 14px", borderRadius: 8,
                          border: isSel ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                          cursor: "pointer",
                          background: isSel ? "rgba(50,85,99,0.06)" : "#fff",
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <p className="bold fs-p9">{r.resumeTitle || "Resume"}</p>
                          <p className="fs-p8 text-secondary">
                            ID: {r.resumeId}{r.date ? ` · ${r.date}` : ""}
                          </p>
                        </div>
                        {isSel && (
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%",
                            background: "var(--primary)", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.7rem", flexShrink: 0,
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedResume && (
                <div className="alert-success mt-2">
                  <p className="fs-p9 text-success bold">
                    Selected: {selectedResume.resumeTitle} (ID: {selectedResume.resumeId})
                  </p>
                </div>
              )}
            </div>

            {!selectedResume && (
              <div className="alert-danger mb-3">
                <p className="fs-p9 text-danger">Please select a resume to submit.</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={applyToJob}
                disabled={applying === showModal.jobSuggestionId || !selectedResume}
                style={{ flex: 1, opacity: !selectedResume ? 0.6 : 1 }}
              >
                {applying === showModal.jobSuggestionId ? "Submitting..." : "Submit Application"}
              </button>
              <button
                className="btn btn-muted"
                style={{ flex: 1 }}
                onClick={() => setShowModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentRecommendations;