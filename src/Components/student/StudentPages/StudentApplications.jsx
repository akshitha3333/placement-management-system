import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
const rest = require("../../../Rest");

// ── Status badge config ────────────────────────────────
const STATUS_CONFIG = {
  APPLIED:              { label: "Applied",             color: "#325563", bg: "rgba(50,85,99,0.1)",   border: "rgba(50,85,99,0.3)",   icon: "📨" },
  CANCELLED:            { label: "Cancelled",           color: "#dc2626", bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.3)",  icon: "❌" },
  REJECTED:             { label: "Rejected",            color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: "🚫" },
  INTERVIEW_SCHEDULED:  { label: "Interview Scheduled", color: "#0ea5e9", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.3)", icon: "📅" },
  SELECTED:             { label: "Selected 🎉",         color: "#16a34a", bg: "rgba(22,163,74,0.1)",  border: "rgba(22,163,74,0.3)",  icon: "🎉" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status, color: "#6b7280", bg: "var(--gray-100)", border: "var(--gray-300)", icon: "•",
  };
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 600, padding: "4px 12px", borderRadius: 12,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────
function StudentApplications() {
  const location = useLocation();
  const navigate  = useNavigate();

  // Mode: "apply" (from Recommendations) or "list"
  const applyMode  = location.state?.applyMode  || false;
  const suggestion = location.state?.suggestion || null;

  // Shared state
  const [resumes,        setResumes]        = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);

  // Apply-mode
  const [submitting,    setSubmitting]    = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError,   setSubmitError]   = useState("");

  // List-mode
  const [applications,  setApplications]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [listError,     setListError]     = useState("");
  const [filterStatus,  setFilterStatus]  = useState("ALL");
  const [search,        setSearch]        = useState("");

  const jsonHeader = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Cookies.get("token") || localStorage.getItem("token") || ""}`,
    },
  });

  // ── Helpers ────────────────────────────────────────────
  const jobTitle   = (job) => job?.tiitle || job?.title || "—";

  const getTutorName = (sug) =>
    sug?.tutorModel?.tutorName ||
    sug?.tutorModel?.name      ||
    sug?.tutorName             ||
    "Your Tutor";

  // ── Fetch resumes ──────────────────────────────────────
  const fetchResumes = async () => {
    try {
      const res  = await axios.get(rest.studentResume, jsonHeader());
      const data = res.data?.data || res.data || [];
      setResumes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchResumes:", err);
    }
  };

  // ── Fetch applications via suggestions ────────────────
  // GET /api/job/job-suggestions
  // → for each: GET /api/job/job-suggestions/{id}/job-applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setListError("");

      // Step 1 – get all suggestions for this student
      const sugRes  = await axios.get(rest.jobSuggestions, jsonHeader());
      const sugList = sugRes.data?.data || sugRes.data || [];
      console.log("✅ Suggestions:", sugList);
      const sugs    = Array.isArray(sugList) ? sugList : [];

      // Step 2 – for each suggestion, get applications
      const appArrays = await Promise.all(
        sugs.map(async (sug) => {
          const sugId = sug.jobSuggestionId || sug.id;
          console.log("➡️ Fetching applications for:", sug.jobSuggestionId);
          try {
            const res  = await axios.get(
              `${rest.jobSuggestions}/${sugId}/job-applications`,
              jsonHeader()
            );
            const apps = res.data?.data || res.data || [];
            console.log("📦 Applications for", sugId, ":", apps);
            return Array.isArray(apps)
              ? apps.map((a) => ({
                  ...a,
                  // Enrich with suggestion data for display
                  jobPostModel: a.jobPostModel || sug.jobPostModel || null,
                  tutorModel:   a.tutorModel   || sug.tutorModel   || null,
                  _sug:         sug,
                }))
              : [];
          } catch {
            return [];
          }
        })
      );

      setApplications(appArrays.flat());
      console.log("🔥 FINAL APPLICATIONS:", appArrays.flat());
    } catch (err) {
      console.error("fetchApplications:", err);
      setListError("Failed to load your applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
    if (!applyMode) {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [applyMode]); // eslint-disable-line

  // ── Submit application ─────────────────────────────────
  // POST /api/job/job-suggestions/{jobSuggestionId}/job-applications
  const handleSubmit = async () => {
    if (!selectedResume) {
      setSubmitError("⚠️ Please select a resume before submitting.");
      return;
    }
    if (!suggestion?.jobSuggestionId) {
      setSubmitError("⚠️ Invalid suggestion data. Please go back and try again.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await axios.post(
        `${rest.jobSuggestions}/${suggestion.jobSuggestionId}/job-applications`,
        { resumeId: selectedResume.resumeId },
        jsonHeader()
      );
      setSubmitSuccess(true);
    } catch (err) {
      console.error("submit application:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error    ||
        "Failed to submit application.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter ─────────────────────────────────────────────
  const filteredApps = applications.filter((app) => {
    const title   = jobTitle(app.jobPostModel).toLowerCase();
    const company = (app.jobPostModel?.companyModel?.companyName || "").toLowerCase();
    const matchQ  = title.includes(search.toLowerCase()) || company.includes(search.toLowerCase());
    const matchS  = filterStatus === "ALL" || app.status === filterStatus;
    return matchQ && matchS;
  });

  // ══════════════════════════════════════════════════════
  // APPLY MODE
  // ══════════════════════════════════════════════════════
  if (applyMode && suggestion) {
    const job = suggestion.jobPostModel || {};

    if (submitSuccess) {
      return (
        <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>
          <div className="card p-5 text-center" style={{ maxWidth: 540, margin: "60px auto" }}>
            <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
            <h3 className="bold mb-2" style={{ color: "var(--success)" }}>Application Submitted!</h3>
            <p className="fs-p9 text-secondary mb-1">
              You've successfully applied for <strong>{jobTitle(job)}</strong>
            </p>
            <p className="fs-p9 text-secondary mb-4">
              at <strong>{job.companyModel?.companyName}</strong>
            </p>
            <div style={{
              background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)",
              borderRadius: 10, padding: "14px 18px", marginBottom: 24, textAlign: "left",
            }}>
              <p className="fs-p8 bold mb-1" style={{ color: "var(--success)" }}>📄 Resume Used</p>
              <p className="fs-p9">{selectedResume?.resumeTitle}</p>
            </div>
            <div className="row g-2">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/student-page/applications", { replace: true })}
              >
                📄 View My Applications
              </button>
              <button
                className="btn btn-muted"
                onClick={() => navigate("/student-page/student-recommended")}
              >
                ← Back to Recommendations
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

        {/* Breadcrumb */}
        <div className="row items-center mb-4" style={{ gap: 8 }}>
          <button
            className="btn btn-muted w-auto"
            style={{ padding: "5px 14px", fontSize: "0.8rem" }}
            onClick={() => navigate("/student-page/student-recommended")}
          >
            ← Back
          </button>
          <p className="fs-p9 text-secondary">Recommended Jobs / Apply</p>
        </div>

        <div className="row g-4" style={{ alignItems: "flex-start" }}>

          {/* ── LEFT: Job Info ── */}
          <div className="col-5">
            <div className="card p-4">
              <p className="fs-p8 text-secondary mb-3" style={{
                textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em",
              }}>
                📋 Job Details
              </p>

              <h3 className="bold mb-1">{jobTitle(job)}</h3>
              <p className="fs-p9 text-secondary mb-3">
                🏢 {job.companyModel?.companyName} &nbsp;·&nbsp; 📍 {job.companyModel?.location}
              </p>

              {/* Recommended by */}
              <div style={{
                background: "rgba(50,85,99,0.07)", borderRadius: 8,
                padding: "10px 14px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "var(--primary)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
                }}>
                  {getTutorName(suggestion).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="fs-p8 text-secondary" style={{ lineHeight: 1.2 }}>Recommended by</p>
                  <p className="bold fs-p9" style={{ color: "var(--primary)" }}>
                    {getTutorName(suggestion)}
                  </p>
                </div>
              </div>

              {/* Meta grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { icon: "👥", label: "Openings",    value: job.requiredCandidate },
                  { icon: "📊", label: "Eligibility", value: job.eligiblePercentage ? `${job.eligiblePercentage}%` : "—" },
                  { icon: "📅", label: "Posted",      value: job.postedDate },
                  { icon: "⏰", label: "Last Date",   value: job.lastDateToApply },
                ].map((m) => (
                  <div key={m.label} className="card p-2" style={{ background: "var(--gray-100)", boxShadow: "none" }}>
                    <p className="fs-p8 text-secondary">{m.icon} {m.label}</p>
                    <p className="bold fs-p9 mt-1">{m.value || "—"}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {job.description && (
                <div>
                  <p className="fs-p8 text-secondary mb-1">📄 Description</p>
                  <p className="fs-p9" style={{ lineHeight: 1.6 }}>{job.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Application Form ── */}
          <div className="col-7">
            <div className="card p-4">
              <h4 className="bold mb-1">🚀 Submit Your Application</h4>
              <p className="fs-p9 text-secondary mb-4">
                Select your resume to apply for this position.
              </p>

              {/* Error */}
              {submitError && (
                <div style={{
                  background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                }}>
                  <p className="fs-p9" style={{ color: "var(--danger)" }}>{submitError}</p>
                </div>
              )}

              {/* Resume Selector */}
              <div className="form-group mb-4">
                <label className="form-control-label mb-2">
                  📄 Select Resume <span style={{ color: "var(--danger)" }}>*</span>
                </label>

                {resumes.length === 0 ? (
                  <div style={{
                    padding: 16, borderRadius: 8,
                    background: "rgba(220,38,38,0.05)", border: "1px dashed rgba(220,38,38,0.3)",
                    textAlign: "center",
                  }}>
                    <p className="fs-p9 bold mb-1" style={{ color: "#dc2626" }}>No resumes found</p>
                    <p className="fs-p9 text-secondary mb-3">
                      Please upload a resume in your Profile before applying.
                    </p>
                    <button
                      className="btn btn-primary w-auto"
                      style={{ padding: "6px 18px", fontSize: "0.85rem", margin: "0 auto" }}
                      onClick={() => navigate("/student-page/profile")}
                    >
                      Go to Profile →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {resumes.map((r) => {
                      const isSel = selectedResume?.resumeId === r.resumeId;
                      return (
                        <div
                          key={r.resumeId}
                          onClick={() => setSelectedResume(r)}
                          style={{
                            padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                            border: isSel ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                            background: isSel ? "rgba(50,85,99,0.05)" : "#fff",
                            transition: "all 0.15s",
                            display: "flex", alignItems: "center", gap: 12,
                          }}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                            background: isSel ? "var(--primary)" : "#e5e7eb",
                            color: isSel ? "#fff" : "#6b7280",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.7rem",
                          }}>
                            PDF
                          </div>
                          <div style={{ flex: 1 }}>
                            <p className="bold fs-p9">{r.resumeTitle || `Resume ${r.resumeId}`}</p>
                            <p className="fs-p8 text-secondary">{r.date || "Uploaded"}</p>
                          </div>
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            background: isSel ? "var(--primary)" : "var(--gray-200)",
                            color: isSel ? "#fff" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.7rem", fontWeight: 700, transition: "all 0.15s",
                          }}>
                            {isSel ? "✓" : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary */}
              {selectedResume && (
                <div style={{
                  background: "rgba(50,85,99,0.05)", border: "1px solid rgba(50,85,99,0.15)",
                  borderRadius: 8, padding: "12px 16px", marginBottom: 16,
                }}>
                  <p className="fs-p8 bold mb-2" style={{ color: "var(--primary)" }}>📋 Application Summary</p>
                  <div className="row" style={{ gap: 16 }}>
                    <div>
                      <p className="fs-p8 text-secondary">Job</p>
                      <p className="fs-p9 bold">{jobTitle(job)}</p>
                    </div>
                    <div>
                      <p className="fs-p8 text-secondary">Company</p>
                      <p className="fs-p9 bold">{job.companyModel?.companyName || "—"}</p>
                    </div>
                    <div>
                      <p className="fs-p8 text-secondary">Resume</p>
                      <p className="fs-p9 bold">{selectedResume.resumeTitle}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="row g-2">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting || !selectedResume}
                  style={{ opacity: !selectedResume ? 0.6 : 1 }}
                >
                  {submitting ? "⏳ Submitting..." : "✅ Submit Application"}
                </button>
                <button
                  className="btn btn-muted"
                  onClick={() => navigate("/student-page/student-recommended")}
                >
                  Cancel
                </button>
              </div>

              {!selectedResume && resumes.length > 0 && (
                <p className="fs-p8 mt-2" style={{ color: "var(--danger)" }}>
                  ⚠️ Please select a resume to continue.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // LIST MODE
  // ══════════════════════════════════════════════════════
  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, key) => {
    acc[key] = applications.filter((a) => a.status === key).length;
    return acc;
  }, {});

  return (
    <div className="p-4" style={{ height: "calc(100vh - 70px)", overflowY: "auto" }}>

      {/* Header */}
      <div className="row space-between items-center mb-4">
        <div>
          <h2 className="fs-5 bold mb-1">📄 My Applications</h2>
          <p className="fs-p9 text-secondary">Track all your job applications and their current status</p>
        </div>
        <button
          className="btn btn-primary w-auto"
          style={{ padding: "8px 20px" }}
          onClick={() => navigate("/student-page/student-recommended")}
        >
          🎯 Browse Recommendations
        </button>
      </div>

      {/* Status stat cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total",     value: applications.length,                                              color: "var(--primary)", icon: "📄" },
          { label: "Applied",   value: statusCounts.APPLIED || 0,                                        color: "#325563",        icon: "📨" },
          { label: "Interview", value: statusCounts.INTERVIEW_SCHEDULED || 0,                            color: "var(--info)",    icon: "📅" },
          { label: "Selected",  value: statusCounts.SELECTED || 0,                                       color: "var(--success)", icon: "🎉" },
          { label: "Rejected",  value: (statusCounts.REJECTED || 0) + (statusCounts.CANCELLED || 0),    color: "var(--danger)",  icon: "🚫" },
        ].map((s, i) => (
          <div className="col p-2" key={i}>
            <div className="card p-3 row items-center g-3">
              <div className="fs-4">{s.icon}</div>
              <div>
                <p className="fs-p8 text-secondary">{s.label}</p>
                <h3 className="bold" style={{ color: s.color }}>{s.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="row g-3 mb-3">
        <div className="col-6">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search by job title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-3">
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications list */}
      {loading ? (
        <div className="card p-5 text-center">
          <p className="text-secondary">Loading your applications...</p>
        </div>
      ) : listError ? (
        <div className="card p-4" style={{ borderLeft: "4px solid var(--danger)" }}>
          <p style={{ color: "var(--danger)" }}>{listError}</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="fs-4 mb-2">📭</p>
          <p className="bold mb-1">No applications yet</p>
          <p className="fs-p9 text-secondary mb-4">
            {applications.length === 0
              ? "You haven't applied to any jobs yet. Browse your tutor's recommendations and apply!"
              : "No applications match your current filter."}
          </p>
          {applications.length === 0 && (
            <button
              className="btn btn-primary w-auto"
              style={{ padding: "8px 24px", margin: "0 auto" }}
              onClick={() => navigate("/student-page/student-recommended")}
            >
              🎯 View Recommendations
            </button>
          )}
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: "hidden" }}>

          {/* Table Header */}
          <div className="row items-center" style={{
            background: "var(--gray-100)", padding: "10px 16px",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)",
          }}>
            <div className="col-3">Job Title</div>
            <div className="col-2">Company</div>
            <div className="col-2">Location</div>
            <div className="col-2">Resume Used</div>
            <div className="col-1 text-center">Applied On</div>
            <div className="col-2 text-center">Status</div>
          </div>

          {/* Rows */}
          {filteredApps.map((app, i) => {
            const job = app.jobPostModel || {};
            return (
              <div
                key={app.jobApplicationId || i}
                className="row items-center"
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border-color)",
                  background: "#fff", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(50,85,99,0.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                {/* Job title */}
                <div className="col-3">
                  <p className="bold fs-p9 mb-1">{jobTitle(job)}</p>
                  {app.tutorModel && (
                    <span style={{
                      fontSize: "0.7rem", padding: "2px 8px", borderRadius: 10,
                      background: "rgba(88,60,160,0.08)", color: "#483b8f",
                      border: "1px solid rgba(88,60,160,0.2)",
                    }}>
                      👨‍🏫 {app.tutorModel?.tutorName || app.tutorModel?.name}
                    </span>
                  )}
                </div>

                <div className="col-2 fs-p9 text-secondary">
                  {job.companyModel?.companyName || "—"}
                </div>

                <div className="col-2 fs-p9 text-secondary">
                  📍 {job.companyModel?.location || "—"}
                </div>

                {/* Resume */}
                <div className="col-2">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      background: "#325563", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.6rem", fontWeight: 700,
                    }}>
                      PDF
                    </div>
                    <p className="fs-p9" style={{
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {app.resumeModel?.resumeTitle || `Resume #${app.resumeId}` || "—"}
                    </p>
                  </div>
                </div>

                <div className="col-1 text-center fs-p8 text-secondary">
                  {app.appliedOn || "—"}
                </div>

                <div className="col-2 text-center">
                  <StatusBadge status={app.status} />
                  {app.status === "INTERVIEW_SCHEDULED" && (
                    <p
                      className="fs-p8 mt-1 cursor-pointer"
                      style={{ color: "var(--info)" }}
                      onClick={() => navigate("/student-page/interviews")}
                    >
                      View Interviews →
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentApplications;